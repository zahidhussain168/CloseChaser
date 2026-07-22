import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { getFirm } from "@/lib/data";
import { qboApiBase, refreshTokens, type TokenSet } from "./oauth";

export type QboConnection = {
  id: string;
  firm_id: string;
  realm_id: string;
  company_name: string | null;
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
  last_synced_at: string | null;
};

/**
 * The signed-in firm's most-recent QuickBooks connection, if any. A firm may
 * connect several QuickBooks companies (one per client realm), so this must not
 * assume a single row, or it errors the moment a second company is linked.
 */
export async function getQboConnection(): Promise<QboConnection | null> {
  const firm = await getFirm();
  if (!firm) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("qbo_connections")
    .select("*")
    .eq("firm_id", firm.id)
    .order("updated_at", { ascending: false })
    .limit(1);
  return ((data?.[0] as QboConnection | undefined) ?? null);
}

/** Every QuickBooks company this firm has connected. */
export async function listQboConnections(): Promise<QboConnection[]> {
  const firm = await getFirm();
  if (!firm) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("qbo_connections")
    .select("*")
    .eq("firm_id", firm.id)
    .order("updated_at", { ascending: false });
  return (data as QboConnection[] | null) ?? [];
}

/** The connection for a specific QuickBooks company (a client's realm). */
export async function getQboConnectionByRealm(realmId: string): Promise<QboConnection | null> {
  const firm = await getFirm();
  if (!firm) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("qbo_connections")
    .select("*")
    .eq("firm_id", firm.id)
    .eq("realm_id", realmId)
    .maybeSingle();
  return (data as QboConnection | null) ?? null;
}

export async function saveQboConnection(params: {
  firmId: string;
  realmId: string;
  companyName?: string | null;
  tokens: TokenSet;
}): Promise<void> {
  const service = createAdminClient();
  const now = Date.now();
  const { error } = await service.from("qbo_connections").upsert(
    {
      firm_id: params.firmId,
      realm_id: params.realmId,
      company_name: params.companyName ?? null,
      access_token: encryptSecret(params.tokens.accessToken),
      refresh_token: encryptSecret(params.tokens.refreshToken),
      access_expires_at: new Date(now + params.tokens.expiresIn * 1000).toISOString(),
      refresh_expires_at: params.tokens.refreshExpiresIn
        ? new Date(now + params.tokens.refreshExpiresIn * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "firm_id,realm_id" },
  );
  // Without this the callback reports success on a failed write, which is how a
  // "connected" QuickBooks ended up with no row behind it.
  if (error) {
    throw new Error(`Could not save the QuickBooks connection: ${error.message}`);
  }
}

/**
 * A usable access token, refreshing first if it expires within two minutes.
 * Intuit rotates the refresh token on every refresh, so the new pair is always
 * written back before the token is handed out.
 */
export async function getAccessToken(conn: QboConnection): Promise<string> {
  const expiresAt = new Date(conn.access_expires_at).getTime();
  if (expiresAt - Date.now() > 120_000) {
    return decryptSecret(conn.access_token);
  }
  const tokens = await refreshTokens(decryptSecret(conn.refresh_token));
  await saveQboConnection({
    firmId: conn.firm_id,
    realmId: conn.realm_id,
    companyName: conn.company_name,
    tokens,
  });
  return tokens.accessToken;
}

/** Authenticated call against the QBO REST API for this connection's company. */
export async function qboFetch(
  conn: QboConnection,
  pathAndQuery: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await getAccessToken(conn);
  const url = `${qboApiBase()}/v3/company/${conn.realm_id}/${pathAndQuery}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

/** Run a QBO SQL-ish query and return the named entity rows. */
export async function qboQuery<T>(
  conn: QboConnection,
  query: string,
  entity: string,
): Promise<T[]> {
  const res = await qboFetch(conn, `query?query=${encodeURIComponent(query)}&minorversion=70`);
  if (!res.ok) {
    throw new Error(`QuickBooks query failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  const json = (await res.json()) as { QueryResponse?: Record<string, T[]> };
  return json.QueryResponse?.[entity] ?? [];
}
