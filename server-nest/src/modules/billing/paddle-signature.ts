import { createHmac, timingSafeEqual } from "crypto";

/**
 * Paddle webhook signature.
 *
 * Paddle authenticates itself with this header, not a session, so the webhook
 * route is necessarily public and this check is the ONLY thing standing between
 * a stranger and the ability to grant themselves a paid plan. It verifies
 * against the raw request bytes: re-serialising parsed JSON does not reproduce
 * what was signed.
 *
 * Header format: `ts=1234567890;h1=<hex hmac of "ts:body">`
 */
export type SignatureResult = { ok: true } | { ok: false; reason: string };

const TOLERANCE_SECONDS = 300;

export function verifyPaddleSignature(
  rawBody: string,
  header: string | null | undefined,
  secret: string | undefined,
  now: Date = new Date(),
): SignatureResult {
  // An unset secret must never mean "allow". Fail closed.
  if (!secret) return { ok: false, reason: "webhook secret is not configured" };
  if (!header) return { ok: false, reason: "missing signature header" };

  const parts: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const [k, v] = pair.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }
  const { ts, h1 } = parts;
  if (!ts || !h1) return { ok: false, reason: "malformed signature header" };

  // Reject stale signatures so a captured request cannot be replayed later.
  const age = Math.abs(now.getTime() / 1000 - Number(ts));
  if (!Number.isFinite(age)) return { ok: false, reason: "bad timestamp" };
  if (age > TOLERANCE_SECONDS) return { ok: false, reason: "signature is stale" };

  const expected = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(h1);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "signature mismatch" };
  }
  return { ok: true };
}
