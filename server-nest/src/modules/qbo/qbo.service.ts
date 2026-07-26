import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { TenantService } from "../../common/tenant.service";
import { QboConnectionService } from "./connection.service";
import { verifyState } from "./state";
import { exchangeCode, revokeToken } from "./oauth";
import { findBlockingTransactions, titleForTxn } from "./sync";

@Injectable()
export class QboService {
  private readonly log = new Logger(QboService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
    private readonly conns: QboConnectionService,
  ) {}

  /** Where the callback sends the browser back to (the app, not this API). */
  private appUrl(status: string, detail?: string): string {
    const base = (process.env.APP_URL ?? "https://ruledoff.vercel.app").replace(/\/+$/, "");
    const url = new URL(`${base}/settings/connections`);
    url.searchParams.set("qbo", status);
    if (detail) url.searchParams.set("detail", detail.slice(0, 140));
    return url.toString();
  }

  /**
   * Handle Intuit's OAuth redirect. Trust comes from the signed state (only the
   * app, sharing ENCRYPTION_KEY, can mint one), so no session is needed. Returns
   * the app URL to redirect the browser to.
   */
  async handleCallback(q: {
    code?: string; realmId?: string; state?: string; error?: string;
  }): Promise<string> {
    if (q.error) return this.appUrl("declined");
    if (!q.code || !q.realmId) return this.appUrl("error", "QuickBooks did not return a company.");

    const verified = verifyState(q.state ?? null);
    if (!verified) return this.appUrl("error", "That connection request expired. Please try again.");

    try {
      const tokens = await exchangeCode(q.code);
      await this.conns.save({ firmId: verified.firmId, realmId: q.realmId, tokens });
    } catch (e) {
      return this.appUrl("error", e instanceof Error ? e.message : "Could not connect QuickBooks.");
    }
    return this.appUrl("connected");
  }

  /** Connection status for the settings and client pages. */
  async status(userId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    const conn = await this.conns.forFirm(firmId);
    return {
      connected: Boolean(conn),
      realmId: conn?.realm_id ?? null,
      companyName: conn?.company_name ?? null,
    };
  }

  /** Pull this month's blocking QuickBooks transactions into the checklist. */
  async importForClient(userId: string, clientId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId);

    const client = await this.prisma.db.clients.findUnique({
      where: { id: clientId },
      select: { qbo_realm_id: true },
    });
    const conn = client?.qbo_realm_id
      ? await this.conns.forRealm(firmId, client.qbo_realm_id)
      : await this.conns.forFirm(firmId);
    if (!conn) {
      throw new BadRequestException(
        client?.qbo_realm_id
          ? "That client's QuickBooks company is not connected."
          : "QuickBooks is not connected yet.",
      );
    }

    const period = await this.ensureCurrentPeriod(clientId);
    const txns = await findBlockingTransactions(this.conns, conn, period.month.toISOString().slice(0, 10));

    const existing = await this.prisma.db.items.findMany({
      where: { close_period_id: period.id, qbo_txn_id: { not: null } },
      select: { qbo_txn_id: true },
    });
    const seen = new Set(existing.map((r) => r.qbo_txn_id));
    const fresh = txns.filter((t) => !seen.has(t.qboTxnId));

    if (fresh.length) {
      await this.prisma.db.items.createMany({
        data: fresh.map((t) => ({
          close_period_id: period.id,
          type: "transaction",
          source: "qbo",
          qbo_txn_id: t.qboTxnId,
          title: titleForTxn(t),
          details: {
            amount: t.amount ?? undefined,
            date: t.date ?? undefined,
            payee: t.payee ?? undefined,
            note: t.memo ?? undefined,
          } as object,
          state: "requested",
        })),
      });
    }
    return { ok: true, added: fresh.length, skipped: txns.length - fresh.length };
  }

  /** Disconnect: revoke the grant (best effort) and delete the row. */
  async disconnect(userId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    const conn = await this.conns.forFirm(firmId);
    if (!conn) return { ok: true };
    try {
      await revokeToken(this.conns.refreshTokenPlain(conn));
    } catch {
      // best effort; the row is removed either way
    }
    await this.conns.remove(conn.id);
    return { ok: true };
  }

  private async ensureCurrentPeriod(clientId: string) {
    const now = new Date();
    const month = new Date(
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00Z`,
    );
    const existing = await this.prisma.db.close_periods.findFirst({
      where: { client_id: clientId, month }, select: { id: true, month: true },
    });
    if (existing) return existing;
    try {
      return await this.prisma.db.close_periods.create({
        data: { client_id: clientId, month, status: "open" }, select: { id: true, month: true },
      });
    } catch {
      const raced = await this.prisma.db.close_periods.findFirst({
        where: { client_id: clientId, month }, select: { id: true, month: true },
      });
      if (raced) return raced;
      throw new BadRequestException("Could not open the current close period");
    }
  }
}
