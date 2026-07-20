import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Signed OAuth state.
 *
 * The callback used to identify the firm from the browser session, which meant
 * a bookkeeper whose session was not present on the exact host Intuit returned
 * to silently failed to connect. The firm is now carried inside the state and
 * signed, so the callback can trust it without a session at all.
 *
 * The signature is the security boundary: only this server can mint a state, so
 * a forged callback cannot bind a QuickBooks company to someone else's firm.
 */
const MAX_AGE_MS = 15 * 60 * 1000;

type StatePayload = { f: string; n: string; t: number };

function secret(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  return Buffer.from(raw, "base64");
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function signState(firmId: string): { state: string; nonce: string } {
  const nonce = randomBytes(16).toString("base64url");
  const payload: StatePayload = { f: firmId, n: nonce, t: Date.now() };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { state: `${body}.${sign(body)}`, nonce };
}

export function verifyState(
  state: string | null,
): { firmId: string; nonce: string } | null {
  if (!state) return null;
  const [body, mac] = state.split(".");
  if (!body || !mac) return null;

  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: StatePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload.f || !payload.n) return null;
  if (!Number.isFinite(payload.t) || Date.now() - payload.t > MAX_AGE_MS) return null;

  return { firmId: payload.f, nonce: payload.n };
}
