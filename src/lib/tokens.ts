import "server-only";
import { randomBytes } from "crypto";

/** Magic-link expiry per the security bar: 30 days. */
export const MAGIC_LINK_TTL_DAYS = 30;

/**
 * Long, unguessable, URL-safe token for a single client's magic link.
 * 32 random bytes → 43-char base64url string.
 */
export function generateMagicToken(): string {
  return randomBytes(32).toString("base64url");
}

export function magicLinkExpiry(from: Date = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + MAGIC_LINK_TTL_DAYS);
  return d.toISOString();
}

export function magicLinkUrl(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/$/, "")}/c/${token}`;
}
