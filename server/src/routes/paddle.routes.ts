import { Router, raw } from "express";
import { admin } from "../lib/supabase";
import { asyncHandler } from "../middleware/asyncHandler";
import { logger } from "../lib/logger";
import { verifyPaddleSignature } from "../services/paddle";

/** Paddle billing webhook. Mounted at /paddle. Uses the RAW body for signature
 *  verification, so this router parses its own body (not the global json parser). */
export const paddleRouter = Router();

/**
 * Map Paddle subscription events onto the firm's billing fields. Paddle
 * identifies the firm via custom_data.firm_id set at checkout, falling back to
 * the customer id.
 */
paddleRouter.post(
  "/webhook",
  raw({ type: "*/*" }),
  asyncHandler(async (req, res) => {
    const raw = req.body as Buffer;
    const valid = verifyPaddleSignature(raw, req.header("paddle-signature"));
    if (!valid) return res.status(401).json({ error: "Invalid signature" });

    const event = JSON.parse(raw.toString("utf8")) as {
      event_type?: string;
      data?: Record<string, any>;
    };
    const data = event.data ?? {};
    const firmId: string | undefined = data.custom_data?.firm_id;
    const customerId: string | undefined = data.customer_id;

    const match = firmId
      ? admin.from("firms").select("id").eq("id", firmId)
      : admin.from("firms").select("id").eq("paddle_customer_id", customerId ?? "__none__");
    const { data: firm } = await match.maybeSingle();
    if (!firm) {
      logger.warn("Paddle webhook: no matching firm", { event: event.event_type });
      return res.json({ ok: true, matched: false });
    }

    const patch: Record<string, unknown> = {};
    switch (event.event_type) {
      case "subscription.created":
      case "subscription.activated":
      case "subscription.updated":
        patch.subscription_status = data.status ?? "active";
        patch.paddle_subscription_id = data.id ?? null;
        patch.paddle_customer_id = customerId ?? null;
        patch.current_period_end = data.current_billing_period?.ends_at ?? null;
        break;
      case "subscription.canceled":
        patch.subscription_status = "canceled";
        break;
      case "subscription.past_due":
        patch.subscription_status = "past_due";
        break;
      default:
        return res.json({ ok: true, ignored: event.event_type });
    }

    await admin.from("firms").update(patch).eq("id", firm.id);
    logger.info("Paddle webhook applied", { event: event.event_type, firm: firm.id });
    res.json({ ok: true });
  }),
);
