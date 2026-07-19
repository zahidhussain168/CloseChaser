import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { generateMagicToken, magicLinkExpiry } from "@/lib/tokens";

type DB = SupabaseClient<Database>;

/** An active (non-revoked, non-expired) link token for a client, if any. */
export async function getActiveToken(
  supabase: DB,
  clientId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("magic_links")
    .select("token, expires_at, revoked_at")
    .eq("client_id", clientId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data.token;
}

/** Reuse an active token or mint a fresh 30-day one. */
export async function ensureMagicToken(
  supabase: DB,
  clientId: string,
): Promise<string> {
  const existing = await getActiveToken(supabase, clientId);
  if (existing) return existing;

  const token = generateMagicToken();
  await supabase.from("magic_links").insert({
    client_id: clientId,
    token,
    expires_at: magicLinkExpiry(),
  });
  return token;
}

/** Revoke all current links and issue a new one. */
export async function regenerateToken(
  supabase: DB,
  clientId: string,
): Promise<string> {
  await supabase
    .from("magic_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .is("revoked_at", null);

  const token = generateMagicToken();
  await supabase.from("magic_links").insert({
    client_id: clientId,
    token,
    expires_at: magicLinkExpiry(),
  });
  return token;
}
