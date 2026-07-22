import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { badRequest, serviceUnavailable, notFound } from "../lib/errors";
import { getSubscriptionState, ensurePaddleCustomer, createPortalSession, isPaddleConfigured } from "../services/paddle";
import type { Firm } from "../domain/types";

/** Billing (Paddle Merchant of Record). Mounted at /billing. */
export const billingRouter = Router();
billingRouter.use(requireAuth);

async function firmOf(req: AuthedRequest): Promise<Firm> {
  const { data } = await req.auth.db.from("firms").select("*").eq("id", req.auth.firmId).single();
  if (!data) throw notFound("Firm not found");
  return data as Firm;
}

/** The firm's subscription / trial state (derived). */
billingRouter.get(
  "/status",
  asyncHandler(async (req, res) => {
    const firm = await firmOf(req as AuthedRequest);
    res.json(getSubscriptionState(firm));
  }),
);

/** Ensure a Paddle customer exists so the client-side overlay can attach the
 *  purchase, and return the ids the checkout needs. */
billingRouter.post(
  "/checkout",
  asyncHandler(async (req, res) => {
    if (!isPaddleConfigured()) throw serviceUnavailable("Billing is not set up yet");
    const areq = req as AuthedRequest;
    const firm = await firmOf(areq);
    const email = areq.auth.email ?? firm.reply_to ?? "";

    let customerId = firm.paddle_customer_id ?? null;
    if (!customerId) {
      try {
        customerId = await ensurePaddleCustomer(email, firm.name);
      } catch (e) {
        throw badRequest(e instanceof Error ? e.message : "Could not reach Paddle");
      }
      await areq.auth.db.from("firms").update({ paddle_customer_id: customerId }).eq("id", firm.id);
    }
    res.json({ ok: true, customerId, firmId: firm.id, email });
  }),
);

/** A short-lived customer-portal link to manage or cancel. */
billingRouter.post(
  "/portal",
  asyncHandler(async (req, res) => {
    const firm = await firmOf(req as AuthedRequest);
    if (!firm.paddle_customer_id) throw badRequest("No billing customer yet");
    const url = await createPortalSession(firm.paddle_customer_id, firm.paddle_subscription_id ? [firm.paddle_subscription_id] : []);
    if (!url) throw badRequest("Could not open the billing portal");
    res.json({ url });
  }),
);
