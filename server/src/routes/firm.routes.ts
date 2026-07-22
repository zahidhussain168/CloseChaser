import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { validate } from "../middleware/validate";
import { badRequest } from "../lib/errors";

/** Firm-level settings: branding, reminder cadence, chase-email copy.
 *  Mounted at /firm. */
export const firmRouter = Router();
firmRouter.use(requireAuth);

/** The caller's firm row (name, branding, cadence, billing fields). */
firmRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { data, error } = await auth.db.from("firms").select("*").eq("id", auth.firmId).single();
    if (error) throw badRequest(error.message);
    res.json({ firm: data });
  }),
);

const branding = z.object({
  name: z.string().trim().min(1),
  accent_color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour"),
  reply_to: z.union([z.string().trim().email(), z.literal("")]).optional(),
});

firmRouter.patch(
  "/branding",
  validate({ body: branding }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const b = req.body as z.infer<typeof branding>;
    const { error } = await auth.db
      .from("firms")
      .update({ name: b.name, accent_color: b.accent_color, reply_to: b.reply_to || null })
      .eq("id", auth.firmId);
    if (error) throw badRequest(error.message);
    res.json({ ok: true });
  }),
);

const cadence = z.object({
  offsets: z.array(z.number().int().min(1).max(90)).min(1).max(6),
  weeklyStep: z.number().int().min(3).max(30),
});

firmRouter.patch(
  "/cadence",
  validate({ body: cadence }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const c = req.body as z.infer<typeof cadence>;
    const offsets = Array.from(new Set(c.offsets)).sort((a, b) => a - b);
    const { error } = await auth.db
      .from("firms")
      .update({ reminder_offsets: offsets, reminder_weekly_step: c.weeklyStep })
      .eq("id", auth.firmId);
    if (error) throw badRequest(error.message);
    res.json({ ok: true });
  }),
);

const emailTemplate = z.object({ subject: z.string().trim().min(1), body: z.string().trim().min(1) });
const kindParam = z.object({ kind: z.enum(["initial", "level1", "level2", "level3", "level4"]) });

firmRouter.put(
  "/email-templates/:kind",
  validate({ params: kindParam, body: emailTemplate }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { subject, body } = req.body as z.infer<typeof emailTemplate>;
    const { error } = await auth.db.from("email_templates").upsert(
      { firm_id: auth.firmId, kind: req.params.kind, subject, body, updated_at: new Date().toISOString() },
      { onConflict: "firm_id,kind" },
    );
    if (error) throw badRequest(error.message);
    res.json({ ok: true });
  }),
);
