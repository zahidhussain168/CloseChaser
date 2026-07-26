/**
 * Intuit OAuth2 for QuickBooks Online. Verbatim port of the app's
 * src/lib/qbo/oauth.ts. Access tokens last an hour; refresh tokens rotate on
 * every use, so the new pair must always be written back.
 */
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

export function qboApiBase(): string {
  return process.env.QBO_ENVIRONMENT === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";
}

function creds() {
  const clientId = process.env.QBO_CLIENT_ID;
  const clientSecret = process.env.QBO_CLIENT_SECRET;
  const redirectUri = process.env.QBO_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("QBO_CLIENT_ID, QBO_CLIENT_SECRET and QBO_REDIRECT_URI must be set");
  }
  return { clientId, clientSecret, redirectUri };
}

export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn?: number;
};

async function tokenRequest(body: URLSearchParams): Promise<TokenSet> {
  const { clientId, clientSecret } = creds();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`QuickBooks token request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    access_token: string; refresh_token: string; expires_in: number; x_refresh_token_expires_in?: number;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in,
    refreshExpiresIn: json.x_refresh_token_expires_in,
  };
}

export function exchangeCode(code: string): Promise<TokenSet> {
  const { redirectUri } = creds();
  return tokenRequest(new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }));
}

export function refreshTokens(refreshToken: string): Promise<TokenSet> {
  return tokenRequest(new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }));
}

export async function revokeToken(token: string): Promise<void> {
  const { clientId, clientSecret } = creds();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  await fetch(REVOKE_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
  }).catch(() => undefined);
}
