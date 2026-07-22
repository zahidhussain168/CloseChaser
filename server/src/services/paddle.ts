import crypto from "node:crypto";
import { env } from "../config/env";
import type { Firm } from "../domain/types";

export type SubStatus = "trialing" | "active" | "past_due" | "paused" | "canceled" | "expired";

export type SubscriptionState = {
  status: SubStatus;
  active: boolean;
  inTrial: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  currentPeriodEnd: string | null;
  hasSubscription: boolean;
};

/**
 * Derive whether a firm may use the app. A live Paddle subscription (active or
 * trialing) grants access. Otherwise access lasts until the 14-day trial window
 * ends. past_due keeps access briefly; canceled/expired do not.
 */
export function getSubscriptionState(firm: Firm, now = new Date()): SubscriptionState {
  const status = (firm.subscription_status ?? "trialing") as SubStatus;
  const trialEndsAt = firm.trial_ends_at ?? null;
  const hasSubscription = Boolean(firm.paddle_subscription_id);

  const trialMs = trialEndsAt ? new Date(trialEndsAt).getTime() - now.getTime() : 0;
  const inTrialWindow = trialMs > 0;
  const trialDaysLeft = Math.max(0, Math.ceil(trialMs / 86_400_000));

  let active = false;
  if (status === "active" || status === "trialing" || status === "past_due") active = true;
  else if (!hasSubscription && inTrialWindow) active = true;

  return {
    status,
    active,
    inTrial: !hasSubscription && inTrialWindow,
    trialEndsAt,
    trialDaysLeft,
    currentPeriodEnd: firm.current_period_end ?? null,
    hasSubscription,
  };
}

/**
 * Verify a Paddle webhook signature. Paddle signs `${ts}:${rawBody}` with the
 * webhook secret (HMAC-SHA256). The header looks like `ts=...;h1=...`.
 * Requires the RAW request body (see the express.raw mount for this route).
 */
export function verifyPaddleSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!env.PADDLE_WEBHOOK_SECRET || !signatureHeader) return false;
  const parts = Object.fromEntries(signatureHeader.split(";").map((kv) => kv.split("=")));
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const signed = `${ts}:${rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", env.PADDLE_WEBHOOK_SECRET).update(signed).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(h1));
  } catch {
    return false;
  }
}

export const isPaddleConfigured = () => Boolean(env.PADDLE_API_KEY && env.PADDLE_PRICE_ID);

function apiBase(): string {
  return env.PADDLE_ENV === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
}

async function paddleFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!env.PADDLE_API_KEY) throw new Error("PADDLE_API_KEY is not set");
  return fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

/** Find or create the Paddle customer for an email. */
export async function ensurePaddleCustomer(email: string, name: string): Promise<string> {
  const found = await paddleFetch(`/customers?email=${encodeURIComponent(email)}`);
  if (found.ok) {
    const json = (await found.json()) as { data?: { id: string }[] };
    if (json.data?.length) return json.data[0].id;
  }
  const created = await paddleFetch("/customers", { method: "POST", body: JSON.stringify({ email, name }) });
  if (!created.ok) throw new Error(`Could not create Paddle customer (${created.status}): ${(await created.text()).slice(0, 200)}`);
  const json = (await created.json()) as { data: { id: string } };
  return json.data.id;
}

/** Short-lived authenticated customer-portal link (manage / cancel). */
export async function createPortalSession(customerId: string, subscriptionIds: string[]): Promise<string | null> {
  const res = await paddleFetch(`/customers/${customerId}/portal-sessions`, {
    method: "POST",
    body: JSON.stringify({ subscription_ids: subscriptionIds }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { urls?: { general?: { overview?: string } } } };
  return json.data?.urls?.general?.overview ?? null;
}
