import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { decryptSecret, encryptSecret } from "./crypto";
import { qboApiBase, refreshTokens, type TokenSet } from "./oauth";

export type QboConnectionRow = {
  id: string;
  firm_id: string;
  realm_id: string;
  company_name: string | null;
  access_token: string;
  refresh_token: string;
  access_expires_at: Date;
};

/**
 * QuickBooks connection storage and authenticated access, ported from the app's
 * src/lib/qbo/connection.ts. Refresh tokens are encrypted at rest with the same
 * key and format the app uses, so a token written by either side works on both.
 */
@Injectable()
export class QboConnectionService {
  constructor(private readonly prisma: PrismaService) {}

  /** The firm's most-recent connection (a firm may link several companies). */
  async forFirm(firmId: string): Promise<QboConnectionRow | null> {
    const rows = await this.prisma.db.qbo_connections.findMany({
      where: { firm_id: firmId },
      orderBy: { updated_at: "desc" },
      take: 1,
    });
    return (rows[0] as QboConnectionRow) ?? null;
  }

  async forRealm(firmId: string, realmId: string): Promise<QboConnectionRow | null> {
    const row = await this.prisma.db.qbo_connections.findFirst({
      where: { firm_id: firmId, realm_id: realmId },
    });
    return (row as QboConnectionRow) ?? null;
  }

  async save(params: { firmId: string; realmId: string; companyName?: string | null; tokens: TokenSet }): Promise<void> {
    const now = Date.now();
    const data = {
      company_name: params.companyName ?? null,
      access_token: encryptSecret(params.tokens.accessToken),
      refresh_token: encryptSecret(params.tokens.refreshToken),
      access_expires_at: new Date(now + params.tokens.expiresIn * 1000),
      refresh_expires_at: params.tokens.refreshExpiresIn
        ? new Date(now + params.tokens.refreshExpiresIn * 1000)
        : null,
      updated_at: new Date(),
    };
    await this.prisma.db.qbo_connections.upsert({
      where: { firm_id_realm_id: { firm_id: params.firmId, realm_id: params.realmId } },
      create: { firm_id: params.firmId, realm_id: params.realmId, ...data },
      update: data,
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.db.qbo_connections.delete({ where: { id } });
  }

  /** A usable access token, refreshing (and re-storing the rotated pair) first. */
  async accessToken(conn: QboConnectionRow): Promise<string> {
    if (conn.access_expires_at.getTime() - Date.now() > 120_000) {
      return decryptSecret(conn.access_token);
    }
    const tokens = await refreshTokens(decryptSecret(conn.refresh_token));
    await this.save({ firmId: conn.firm_id, realmId: conn.realm_id, companyName: conn.company_name, tokens });
    return tokens.accessToken;
  }

  async fetch(conn: QboConnectionRow, pathAndQuery: string, init?: RequestInit): Promise<Response> {
    const token = await this.accessToken(conn);
    const url = `${qboApiBase()}/v3/company/${conn.realm_id}/${pathAndQuery}`;
    return fetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
  }

  async query<T>(conn: QboConnectionRow, query: string, entity: string): Promise<T[]> {
    const res = await this.fetch(conn, `query?query=${encodeURIComponent(query)}&minorversion=70`);
    if (!res.ok) {
      throw new Error(`QuickBooks query failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    const json = (await res.json()) as { QueryResponse?: Record<string, T[]> };
    return json.QueryResponse?.[entity] ?? [];
  }

  /** Refresh-token for revoke on disconnect. */
  refreshTokenPlain(conn: QboConnectionRow): string {
    return decryptSecret(conn.refresh_token);
  }
}
