import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";

/**
 * Symmetric encryption for third-party credentials at rest (QBO refresh tokens).
 * AES-256-GCM. Format and key handling MATCH the Next.js app exactly
 * (`v1.iv.tag.ct`, ENCRYPTION_KEY = 32 random bytes base64) so both services can
 * read and write the same `qbo_connections` rows.
 */
const PREFIX = "v1";

function key(): Buffer {
  const raw = env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes, base64 encoded");
  return buf;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(".");
}

export function decryptSecret(payload: string): string {
  const [version, ivB64, tagB64, ctB64] = payload.split(".");
  if (version !== PREFIX || !ivB64 || !tagB64 || !ctB64) throw new Error("Stored secret is not in the expected format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}

// ---- Signed OAuth state (matches the Next.js app: body.mac, base64 key) ----
const STATE_MAX_AGE_MS = 15 * 60 * 1000;
type StatePayload = { f: string; n: string; t: number };

function sign(body: string): string {
  return createHmac("sha256", key()).update(body).digest("base64url");
}

export function signState(firmId: string): string {
  const payload: StatePayload = { f: firmId, n: randomBytes(16).toString("base64url"), t: Date.now() };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyState(state: string | null): { firmId: string } | null {
  if (!state) return null;
  const [body, mac] = state.split(".");
  if (!body || !mac) return null;
  const a = Buffer.from(mac);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload: StatePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload.f || !Number.isFinite(payload.t) || Date.now() - payload.t > STATE_MAX_AGE_MS) return null;
  return { firmId: payload.f };
}
