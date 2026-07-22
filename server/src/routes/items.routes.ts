import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { validate, uuid } from "../middleware/validate";
import { badRequest, notFound } from "../lib/errors";
import { getConnection } from "../services/qbo";
import { syncItemToQbo } from "../services/qboWriteback";
import type { Item } from "../domain/types";

/** Item-level actions. Mounted at /items. */
export const itemsRouter = Router();
itemsRouter.use(requireAuth);

itemsRouter.delete(
  "/:id",
  validate({ params: z.object({ id: uuid }) }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { error } = await auth.db.from("items").delete().eq("id", req.params.id);
    if (error) throw badRequest(error.message);
    res.status(204).end();
  }),
);

/** Accept an item: rule it off. (QBO-sourced items also sync back to QuickBooks
 *  via the qbo service once connected.) */
itemsRouter.post(
  "/:id/accept",
  validate({ params: z.object({ id: uuid }) }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { data, error } = await auth.db
      .from("items")
      .update({ state: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("*")
      .maybeSingle();
    if (error) throw badRequest(error.message);
    if (!data) throw notFound("Item not found");

    // QuickBooks-sourced items push the answer + receipts back on accept
    // (best effort: a QBO outage never blocks ruling an item off).
    const item = data as Item;
    let qboSync: { ok: boolean; error?: string } | null = null;
    if (item.source === "qbo" && item.qbo_txn_id) {
      const conn = await getConnection(auth.firmId);
      if (conn) qboSync = await syncItemToQbo(item, conn);
    }

    // If every item in the period is now accepted, close the period.
    const { data: siblings } = await auth.db.from("items").select("state").eq("close_period_id", item.close_period_id);
    if (siblings && siblings.length > 0 && siblings.every((s) => s.state === "accepted")) {
      await auth.db.from("close_periods").update({ status: "closed" }).eq("id", item.close_period_id);
    }

    res.json({ item, qboSync });
  }),
);

/** Send an answered item back to the client for another try. */
itemsRouter.post(
  "/:id/reopen",
  validate({ params: z.object({ id: uuid }) }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { data, error } = await auth.db
      .from("items")
      .update({ state: "requested", answered_at: null })
      .eq("id", req.params.id)
      .select("*")
      .maybeSingle();
    if (error) throw badRequest(error.message);
    if (!data) throw notFound("Item not found");
    res.json({ item: data });
  }),
);
