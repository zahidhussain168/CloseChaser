import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { validate } from "../middleware/validate";
import { badRequest, serviceUnavailable } from "../lib/errors";
import { generateChaseEmails, isAiConfigured, type EmailKind, type GeneratedSet } from "../services/ai";

/** AI chase-email generation. Mounted at /ai. */
export const aiRouter = Router();
aiRouter.use(requireAuth);

const template = z.object({ subject: z.string().min(1), body: z.string().min(1) });
const generatedSet = z.object({
  initial: template,
  level1: template,
  level2: template,
  level3: template,
  level4: template,
});

/** Draft all five chase emails from the firm's voice. */
aiRouter.post(
  "/generate-emails",
  validate({ body: z.object({ voice: z.string().default(""), tone: z.enum(["Warm", "Balanced", "Firm"]).default("Warm") }) }),
  asyncHandler(async (req, res) => {
    if (!isAiConfigured()) throw serviceUnavailable("AI generation is not configured");
    const { auth } = req as AuthedRequest;
    const { voice, tone } = req.body as { voice: string; tone: string };
    const { data: firm } = await auth.db.from("firms").select("name").eq("id", auth.firmId).single();
    const templates = await generateChaseEmails({ firmName: firm?.name ?? "Your bookkeeper", voice, tone });
    res.json({ templates });
  }),
);

/** Save a generated set as the firm's active templates. */
aiRouter.post(
  "/save-emails",
  validate({ body: z.object({ templates: generatedSet }) }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const templates = (req.body as { templates: GeneratedSet }).templates;
    const rows = (Object.keys(templates) as EmailKind[]).map((kind) => ({
      firm_id: auth.firmId,
      kind,
      subject: templates[kind].subject,
      body: templates[kind].body,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await auth.db.from("email_templates").upsert(rows, { onConflict: "firm_id,kind" });
    if (error) throw badRequest(error.message);
    res.json({ ok: true, saved: rows.length });
  }),
);
