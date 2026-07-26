import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify the signed OAuth state the app's /api/qbo/connect minted. The
 * signature is HMAC-SHA256 over the payload keyed with ENCRYPTION_KEY, so only
 * the app (which shares that key) can produce a state this accepts. That is the
 * security boundary: a forged callback cannot bind a company to another firm.
 */
const MAX_AGE_MS = 15 * 60 * 1000;

function secret(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  return Buffer.from(raw, "base64");
}

export function verifyState(state: string | null): { firmId: string; nonce: string } | null {
  if (!state) return null;
  const [body, mac] = state.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload: { f?: string; n?: string; t?: number };
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload.f || !payload.n) return null;
  if (!Number.isFinite(payload.t) || Date.now() - (payload.t as number) > MAX_AGE_MS) return null;
  return { firmId: payload.f, nonce: payload.n };
}
