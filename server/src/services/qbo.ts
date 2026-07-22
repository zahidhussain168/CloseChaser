import { admin } from "../lib/supabase";
import { env } from "../config/env";
import { encryptSecret, decryptSecret, signState, verifyState } from "./crypto";

export { signState, verifyState };

export const isQboConfigured = () =>
  Boolean(env.QBO_CLIENT_ID && env.QBO_CLIENT_SECRET && env.QBO_REDIRECT_URI && env.ENCRYPTION_KEY);

const AUTHORIZE_URL = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";
const SCOPE = "com.intuit.quickbooks.accounting";

export function qboApiBase(): string {
  return env.QBO_ENVIRONMENT === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";
}

export type TokenSet = { accessToken: string; refreshToken: string; expiresIn: number; refreshExpiresIn?: number };

export function authorizeUrl(firmId: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", env.QBO_CLIENT_ID!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("redirect_uri", env.QBO_REDIRECT_URI!);
  url.searchParams.set("state", signState(firmId));
  return url.toString();
}

async function tokenRequest(body: URLSearchParams): Promise<TokenSet> {
  const basic = Buffer.from(`${env.QBO_CLIENT_ID}:${env.QBO_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!res.ok) throw new Error(`QuickBooks token request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in?: number;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in,
    refreshExpiresIn: json.x_refresh_token_expires_in,
  };
}

export function exchangeCode(code: string): Promise<TokenSet> {
  return tokenRequest(new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: env.QBO_REDIRECT_URI! }));
}

export function refreshTokens(refreshToken: string): Promise<TokenSet> {
  return tokenRequest(new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }));
}

export async function revokeToken(token: string): Promise<void> {
  const basic = Buffer.from(`${env.QBO_CLIENT_ID}:${env.QBO_CLIENT_SECRET}`).toString("base64");
  await fetch(REVOKE_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  }).catch(() => undefined);
}

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

export async function getConnection(firmId: string): Promise<QboConnection | null> {
  const { data } = await admin.from("qbo_connections").select("*").eq("firm_id", firmId).maybeSingle();
  return (data as QboConnection | null) ?? null;
}

export async function saveConnection(params: {
  firmId: string;
  realmId: string;
  companyName?: string | null;
  tokens: TokenSet;
}): Promise<void> {
  const now = Date.now();
  const { error } = await admin.from("qbo_connections").upsert(
    {
      firm_id: params.firmId,
      realm_id: params.realmId,
      company_name: params.companyName ?? null,
      access_token: encryptSecret(params.tokens.accessToken),
      refresh_token: encryptSecret(params.tokens.refreshToken),
      access_expires_at: new Date(now + params.tokens.expiresIn * 1000).toISOString(),
      refresh_expires_at: params.tokens.refreshExpiresIn ? new Date(now + params.tokens.refreshExpiresIn * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "firm_id,realm_id" },
  );
  if (error) throw new Error(`Could not save the QuickBooks connection: ${error.message}`);
}

export async function deleteConnection(firmId: string): Promise<void> {
  const conn = await getConnection(firmId);
  if (conn) {
    try {
      await revokeToken(decryptSecret(conn.refresh_token));
    } catch {
      /* best effort */
    }
  }
  await admin.from("qbo_connections").delete().eq("firm_id", firmId);
}

/** A usable access token, refreshing (and rotating) if it expires within 2 min. */
export async function getAccessToken(conn: QboConnection): Promise<string> {
  if (new Date(conn.access_expires_at).getTime() - Date.now() > 120_000) {
    return decryptSecret(conn.access_token);
  }
  const tokens = await refreshTokens(decryptSecret(conn.refresh_token));
  await saveConnection({ firmId: conn.firm_id, realmId: conn.realm_id, companyName: conn.company_name, tokens });
  return tokens.accessToken;
}

export async function qboFetch(conn: QboConnection, pathAndQuery: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken(conn);
  const url = `${qboApiBase()}/v3/company/${conn.realm_id}/${pathAndQuery}`;
  return fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(init?.headers ?? {}) } });
}

export async function qboQuery<T>(conn: QboConnection, query: string, entity: string): Promise<T[]> {
  const res = await qboFetch(conn, `query?query=${encodeURIComponent(query)}&minorversion=70`);
  if (!res.ok) throw new Error(`QuickBooks query failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { QueryResponse?: Record<string, T[]> };
  return json.QueryResponse?.[entity] ?? [];
}
