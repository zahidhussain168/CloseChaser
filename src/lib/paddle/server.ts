import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paddle Billing (Merchant of Record) server helpers.
 *
 * Sandbox and production use different hosts and non-interchangeable keys.
 * Everything is env-driven so the app deploys before keys exist and lights up
 * the moment they are added.
 */

export function paddleEnv(): "sandbox" | "production" {
  return process.env.PADDLE_ENV === "production" ? "production" : "sandbox";
}

function apiBase(): string {
  return paddleEnv() === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

export function isBillingConfigured(): boolean {
  return Boolean(process.env.PADDLE_API_KEY && process.env.PADDLE_PRICE_ID);
}

async function paddleFetch(path: string, init?: RequestInit): Promise<Response> {
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error("PADDLE_API_KEY is not set");
  return fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

/** Find or create the Paddle customer for a firm's email. */
export async function ensurePaddleCustomer(
  email: string,
  name: string,
): Promise<string> {
  // Try to reuse an existing customer with this email first.
  const found = await paddleFetch(`/customers?email=${encodeURIComponent(email)}`);
  if (found.ok) {
    const json = (await found.json()) as { data?: { id: string }[] };
    if (json.data?.length) return json.data[0].id;
  }
  const created = await paddleFetch("/customers", {
    method: "POST",
    body: JSON.stringify({ email, name }),
  });
  if (!created.ok) {
    throw new Error(`Could not create Paddle customer (${created.status}): ${(await created.text()).slice(0, 200)}`);
  }
  const json = (await created.json()) as { data: { id: string } };
  return json.data.id;
}

/**
 * Short-lived, single-use authenticated portal link so a customer can manage or
 * cancel their subscription. Must be generated on demand, never cached.
 */
export async function createPortalSession(
  customerId: string,
  subscriptionIds: string[],
): Promise<string | null> {
  const res = await paddleFetch(`/customers/${customerId}/portal-sessions`, {
    method: "POST",
    body: JSON.stringify({ subscription_ids: subscriptionIds }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: { urls?: { general?: { overview?: string } } };
  };
  return json.data?.urls?.general?.overview ?? null;
}

/**
 * Verify a Paddle webhook. The Paddle-Signature header is `ts=<unix>;h1=<hex>`,
 * and the signature is HMAC-SHA256 of `<ts>:<rawBody>` keyed with the endpoint
 * secret. Verify against the RAW body: any re-serialisation breaks the match.
 */
export function verifyPaddleSignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret || !header) return false;

  const parts = Object.fromEntries(
    header.split(";").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    }),
  );
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  // Reject stale signatures (5 minute tolerance) to blunt replay attempts.
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(h1);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
