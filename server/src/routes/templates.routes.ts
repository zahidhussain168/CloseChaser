import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { validate, uuid } from "../middleware/validate";
import { badRequest } from "../lib/errors";
import { ensureCurrentPeriod } from "../services/periods";
import { STARTER_TEMPLATES } from "../domain/starterTemplates";

/** Request templates: reusable checklists a firm assigns to clients.
 *  Mounted at /templates. */
export const templatesRouter = Router();
templatesRouter.use(requireAuth);

/** List templates with their items. */
templatesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { data: templates } = await auth.db.from("request_templates").select("*").order("created_at", { ascending: true });
    const list = templates ?? [];
    const withItems = await Promise.all(
      list.map(async (t) => {
        const { data: items } = await auth.db.from("template_items").select("*").eq("template_id", t.id).order("position", { ascending: true });
        return { ...t, items: items ?? [] };
      }),
    );
    res.json({ templates: withItems });
  }),
);

templatesRouter.post(
  "/",
  validate({ body: z.object({ name: z.string().trim().min(1, "Name the template") }) }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { data, error } = await auth.db
      .from("request_templates")
      .insert({ firm_id: auth.firmId, name: req.body.name })
      .select("*")
      .single();
    if (error) throw badRequest(error.message);
    res.status(201).json({ template: data });
  }),
);

/** Drop in a ready-made starter pack (1099, onboarding, monthly close). */
templatesRouter.post(
  "/starter",
  validate({ body: z.object({ key: z.string() }) }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const pack = STARTER_TEMPLATES.find((t) => t.key === req.body.key);
    if (!pack) throw badRequest("Unknown starter pack");

    const { data: tpl, error } = await auth.db
      .from("request_templates")
      .insert({ firm_id: auth.firmId, name: pack.name })
      .select("id")
      .single();
    if (error || !tpl) throw badRequest(error?.message ?? "Could not create the template");

    const rows = pack.items.map((item, i) => ({
      template_id: tpl.id,
      type: item.type,
      title: item.title,
      note: item.note ?? null,
      position: i,
    }));
    const { error: itemsError } = await auth.db.from("template_items").insert(rows);
    if (itemsError) throw badRequest(itemsError.message);
    res.status(201).json({ ok: true });
  }),
);

templatesRouter.delete(
  "/:id",
  validate({ params: z.object({ id: uuid }) }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { error } = await auth.db.from("request_templates").delete().eq("id", req.params.id);
    if (error) throw badRequest(error.message);
    res.status(204).end();
  }),
);

const templateItem = z.object({
  type: z.enum(["transaction", "document"]),
  title: z.string().trim().min(1, "Describe the request"),
  note: z.string().trim().optional(),
});

templatesRouter.post(
  "/:id/items",
  validate({ params: z.object({ id: uuid }), body: templateItem }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const b = req.body as z.infer<typeof templateItem>;
    const { count } = await auth.db.from("template_items").select("id", { count: "exact", head: true }).eq("template_id", req.params.id);
    const { data, error } = await auth.db
      .from("template_items")
      .insert({ template_id: req.params.id, type: b.type, title: b.title, note: b.note || null, position: count ?? 0 })
      .select("*")
      .single();
    if (error) throw badRequest(error.message);
    res.status(201).json({ item: data });
  }),
);

templatesRouter.delete(
  "/items/:id",
  validate({ params: z.object({ id: uuid }) }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { error } = await auth.db.from("template_items").delete().eq("id", req.params.id);
    if (error) throw badRequest(error.message);
    res.status(204).end();
  }),
);

/** Apply a template's items to a client's current close now. */
templatesRouter.post(
  "/:id/apply",
  validate({ params: z.object({ id: uuid }), body: z.object({ clientId: uuid }) }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const period = await ensureCurrentPeriod(auth.db, req.body.clientId);
    if (!period) throw badRequest("Could not open the close period");

    const { data: tItems } = await auth.db.from("template_items").select("*").eq("template_id", req.params.id).order("position", { ascending: true });
    const items = tItems ?? [];
    if (items.length === 0) return res.json({ ok: true, added: 0 });

    const rows = items.map((t) => ({
      close_period_id: period.id,
      type: t.type,
      source: "manual" as const,
      title: t.title,
      details: t.note ? { note: t.note } : {},
      state: "requested" as const,
    }));
    const { error } = await auth.db.from("items").insert(rows);
    if (error) throw badRequest(error.message);
    res.json({ ok: true, added: rows.length });
  }),
);
