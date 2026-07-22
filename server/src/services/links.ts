import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Long, URL-safe random token, single-client scoped. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function magicLinkUrl(token: string): string {
  return `${env.APP_URL.replace(/\/$/, "")}/c/${token}`;
}

/** Return a live token for the client, creating one if none is active. */
export async function ensureMagicToken(db: SupabaseClient, clientId: string): Promise<string> {
  const nowIso = new Date().toISOString();
  const { data: existing } = await db
    .from("magic_links")
    .select("token")
    .eq("client_id", clientId)
    .is("revoked_at", null)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.token) return existing.token as string;

  const token = generateToken();
  const expires = new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
  const { error } = await db.from("magic_links").insert({ client_id: clientId, token, expires_at: expires });
  if (error) throw new Error(error.message);
  return token;
}

/** Revoke all existing links for the client and mint a fresh one. */
export async function regenerateToken(db: SupabaseClient, clientId: string): Promise<string> {
  await db
    .from("magic_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .is("revoked_at", null);
  const token = generateToken();
  const expires = new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
  const { error } = await db.from("magic_links").insert({ client_id: clientId, token, expires_at: expires });
  if (error) throw new Error(error.message);
  return token;
}

/** Resolve a client_id from a token, enforcing not-revoked and not-expired. */
export async function resolveToken(
  db: SupabaseClient,
  token: string,
): Promise<{ clientId: string } | { error: "not_found" | "expired" | "revoked" }> {
  const { data } = await db
    .from("magic_links")
    .select("client_id, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();
  if (!data) return { error: "not_found" };
  if (data.revoked_at) return { error: "revoked" };
  if (new Date(data.expires_at as string).getTime() <= Date.now()) return { error: "expired" };
  // Best-effort: record that the link was opened.
  await db.from("magic_links").update({ last_opened_at: new Date().toISOString() }).eq("token", token);
  return { clientId: data.client_id as string };
}
