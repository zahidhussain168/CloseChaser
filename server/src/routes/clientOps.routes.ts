import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { validate, uuid } from "../middleware/validate";
import { badRequest, notFound, serviceUnavailable } from "../lib/errors";
import { ensureCurrentPeriod } from "../services/periods";
import { ensureMagicToken, regenerateToken, magicLinkUrl } from "../services/links";
import { sendChaseEmail } from "../services/chase";
import { openCount, isOpen } from "../domain/state";
import type { Client, Firm, Item } from "../domain/types";

/** Client-scoped operations: the checklist, adding requests, firing a chase,
 *  and the magic link. Mounted at /clients. */
export const clientOpsRouter = Router();
clientOpsRouter.use(requireAuth);

async function loadClient(req: AuthedRequest, id: string): Promise<Client> {
  const { data } = await req.auth.db.from("clients").select("*").eq("id", id).maybeSingle();
  if (!data) throw notFound("Client not found");
  return data as Client;
}

/** The current close: period, items, open count, and link status. */
clientOpsRouter.get(
  "/:id/checklist",
  validate({ params: z.object({ id: uuid }) }),
  asyncHandler(async (req, res) => {
    const areq = req as AuthedRequest;
    const client = await loadClient(areq, req.params.id);
    const period = await ensureCurrentPeriod(areq.auth.db, client.id);
    if (!period) throw badRequest("Could not open the close period");

    const { data: items } = await areq.auth.db
      .from("items")
      .select("*")
      .eq("close_period_id", period.id)
      .order("created_at", { ascending: true });

    const { data: link } = await areq.auth.db
      .from("magic_links")
      .select("token, last_opened_at")
      .eq("client_id", client.id)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .maybeSingle();

    res.json({
      client,
      period,
      items: items ?? [],
      openCount: openCount((items as Item[]) ?? []),
      link: link ? { url: magicLinkUrl(link.token as string), openedAt: link.last_opened_at } : null,
    });
  }),
);

const addItem = z
  .object({
    type: z.enum(["transaction", "document", "questionnaire"]),
    title: z.string().trim().min(1, "Describe what you need"),
    note: z.string().trim().optional(),
    questions: z.array(z.string().trim().min(1)).optional(),
  })
  .refine((v) => v.type !== "questionnaire" || (v.questions?.length ?? 0) > 0, {
    message: "A questionnaire needs at least one question",
    path: ["questions"],
  });

/** Add a request (document, transaction, or questionnaire) to the current close. */
clientOpsRouter.post(
  "/:id/items",
  validate({ params: z.object({ id: uuid }), body: addItem }),
  asyncHandler(async (req, res) => {
    const areq = req as AuthedRequest;
    const client = await loadClient(areq, req.params.id);
    const period = await ensureCurrentPeriod(areq.auth.db, client.id);
    if (!period) throw badRequest("Could not open the close period");

    const body = req.body as z.infer<typeof addItem>;
    const details: Record<string, unknown> = {};
    if (body.note) details.note = body.note;
    if (body.type === "questionnaire") details.questions = body.questions;

    const { data, error } = await areq.auth.db
      .from("items")
      .insert({ close_period_id: period.id, type: body.type, source: "manual", title: body.title, details, state: "requested" })
      .select("*")
      .single();
    if (error) throw badRequest(error.message);
    res.status(201).json({ item: data });
  }),
);

/** Fire a chase: mark the period chasing and send the initial email. */
clientOpsRouter.post(
  "/:id/chase",
  validate({ params: z.object({ id: uuid }) }),
  asyncHandler(async (req, res) => {
    const areq = req as AuthedRequest;
    const client = await loadClient(areq, req.params.id);
    const period = await ensureCurrentPeriod(areq.auth.db, client.id);
    if (!period) throw badRequest("Could not open the close period");

    const { data: items } = await areq.auth.db.from("items").select("*").eq("close_period_id", period.id);
    const allItems = (items as Item[]) ?? [];
    if (allItems.filter((i) => isOpen(i.state)).length === 0) {
      throw badRequest("Nothing open to chase. This close is clear.");
    }

    const { data: firm } = await areq.auth.db.from("firms").select("*").eq("id", areq.auth.firmId).single();
    const token = await ensureMagicToken(areq.auth.db, client.id);

    // Preserve the original chase start so re-chasing does not reset the cadence.
    await areq.auth.db
      .from("close_periods")
      .update({ status: "chasing", chase_started_at: period.chase_started_at ?? new Date().toISOString() })
      .eq("id", period.id);

    const result = await sendChaseEmail({
      db: areq.auth.db,
      firm: firm as Firm,
      client,
      kind: "initial",
      items: allItems,
      token,
      monthISO: period.month,
    });

    res.json({ ok: result.ok, sent: result.ok, link: magicLinkUrl(token), error: result.ok ? undefined : result.error });
  }),
);

/** Get the client's active magic link. */
clientOpsRouter.get(
  "/:id/link",
  validate({ params: z.object({ id: uuid }) }),
  asyncHandler(async (req, res) => {
    const areq = req as AuthedRequest;
    const client = await loadClient(areq, req.params.id);
    const token = await ensureMagicToken(areq.auth.db, client.id);
    res.json({ url: magicLinkUrl(token) });
  }),
);

/** Set (or clear) the template a client auto-applies each month. */
clientOpsRouter.post(
  "/:id/default-template",
  validate({ params: z.object({ id: uuid }), body: z.object({ templateId: z.union([uuid, z.null()]) }) }),
  asyncHandler(async (req, res) => {
    const areq = req as AuthedRequest;
    await loadClient(areq, req.params.id);
    const { error } = await areq.auth.db
      .from("clients")
      .update({ default_template_id: req.body.templateId || null })
      .eq("id", req.params.id);
    if (error) throw badRequest(error.message);
    res.json({ ok: true });
  }),
);

/** Revoke and reissue the client's magic link. */
clientOpsRouter.post(
  "/:id/link/regenerate",
  validate({ params: z.object({ id: uuid }) }),
  asyncHandler(async (req, res) => {
    const areq = req as AuthedRequest;
    const client = await loadClient(areq, req.params.id);
    const token = await regenerateToken(areq.auth.db, client.id);
    res.json({ url: magicLinkUrl(token) });
  }),
);
