import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import crypto from "node:crypto";
import { admin } from "../lib/supabase";
import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate";
import { portalLimiter } from "../middleware/rateLimit";
import { badRequest, notFound } from "../lib/errors";
import { loadPortal, itemForToken, ATTACHMENTS_BUCKET } from "../services/portal";
import type { Attachment } from "../domain/types";

/** Public, no-login client portal. Mounted at /c. Rate limited; scoped by
 *  magic-link token only. */
export const portalRouter = Router();
portalRouter.use(portalLimiter);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const tokenParam = z.object({ token: z.string().min(20) });

/** The client's checklist. */
portalRouter.get(
  "/:token",
  validate({ params: tokenParam }),
  asyncHandler(async (req, res) => {
    const result = await loadPortal(req.params.token);
    if ("error" in result) return res.status(result.error === "not_found" ? 404 : 410).json(result);
    res.json(result);
  }),
);

/** Answer an item (text). Moves it to `answered`. */
portalRouter.post(
  "/:token/answer",
  validate({ params: tokenParam, body: z.object({ itemId: z.string().uuid(), text: z.string() }) }),
  asyncHandler(async (req, res) => {
    const { itemId, text } = req.body as { itemId: string; text: string };
    const item = await itemForToken(req.params.token, itemId);
    if (!item) throw notFound("Item not found for this link");
    if (item.state === "accepted") throw badRequest("This item is already finalized");

    const answer = text.trim();
    const state = answer.length > 0 ? "answered" : item.attachments.length > 0 ? "answered" : "requested";
    const { data, error } = await admin
      .from("items")
      .update({ answer_text: answer || null, state, answered_at: state === "answered" ? new Date().toISOString() : null })
      .eq("id", itemId)
      .select("state, answer_text")
      .single();
    if (error) throw badRequest(error.message);
    res.json({ ok: true, state: data.state, answer_text: data.answer_text });
  }),
);

/** Upload a file for an item. Stored in the private bucket; moves it to
 *  `answered`. */
portalRouter.post(
  "/:token/upload",
  validate({ params: tokenParam }),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const itemId = String(req.body.itemId ?? "");
    if (!z.string().uuid().safeParse(itemId).success) throw badRequest("Missing itemId");
    const file = req.file;
    if (!file) throw badRequest("No file uploaded");

    const item = await itemForToken(req.params.token, itemId);
    if (!item) throw notFound("Item not found for this link");
    if (item.state === "accepted") throw badRequest("This item is already finalized");

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${item.close_period_id}/${itemId}/${crypto.randomUUID()}-${safeName}`;
    const { error: upErr } = await admin.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (upErr) throw badRequest(`Upload failed: ${upErr.message}`);

    const attachment: Attachment = {
      path,
      name: file.originalname,
      size: file.size,
      mime: file.mimetype,
      uploaded_at: new Date().toISOString(),
    };
    const attachments = [...(item.attachments ?? []), attachment];
    const { data, error } = await admin
      .from("items")
      .update({ attachments, state: "answered", answered_at: new Date().toISOString() })
      .eq("id", itemId)
      .select("state, attachments")
      .single();
    if (error) throw badRequest(error.message);
    res.json({ ok: true, state: data.state, attachments: (data.attachments as Attachment[]).map((a) => ({ name: a.name })) });
  }),
);
