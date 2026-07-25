import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { TenantService } from "../../common/tenant.service";

/**
 * The dashboard rollup: every client ranked by how much they are blocking the
 * close, plus a firm-wide summary of what is outstanding.
 *
 * This is a faithful port of the frontend's listClientsWithBlocking +
 * getCloseRollup, so the migrated page shows exactly what it did before. The
 * one change is that items are fetched ONCE here (the original queried them
 * twice), which matters because every round trip crosses into the DB region.
 */
const OPEN_STATES = ["requested", "nudged"];

function monthKey(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function isOpen(state: string): boolean {
  return state === "requested" || state === "nudged";
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
  ) {}

  async get(userId: string, now = new Date()) {
    const firmId = await this.tenant.firmIdForUser(userId);
    const month = new Date(`${monthKey(now)}T00:00:00Z`);

    // Every client for the firm.
    const clients = await this.prisma.db.clients.findMany({
      where: { firm_id: firmId },
      orderBy: { created_at: "asc" },
    });
    if (clients.length === 0) {
      return { clients: [], rollup: this.emptyRollup() };
    }
    const ids = clients.map((c) => c.id);

    // This month's period per client, in one query.
    const periods = await this.prisma.db.close_periods.findMany({
      where: { client_id: { in: ids }, month },
    });
    const periodByClient = new Map(periods.map((p) => [p.client_id, p]));

    // All items on those periods, once, with every field either rollup needs.
    const periodIds = periods.map((p) => p.id);
    const items = periodIds.length
      ? await this.prisma.db.items.findMany({
          where: { close_period_id: { in: periodIds } },
          select: { title: true, type: true, state: true, created_at: true, close_period_id: true },
        })
      : [];
    const itemsByPeriod = new Map<string, typeof items>();
    for (const it of items) {
      const arr = itemsByPeriod.get(it.close_period_id) ?? [];
      arr.push(it);
      itemsByPeriod.set(it.close_period_id, arr);
    }

    // Latest live magic link per client, in one query (newest first, first wins).
    const links = await this.prisma.db.magic_links.findMany({
      where: { client_id: { in: ids }, revoked_at: null },
      orderBy: { created_at: "desc" },
      select: { client_id: true, last_opened_at: true, expires_at: true },
    });
    const linkByClient = new Map<string, (typeof links)[number]>();
    for (const l of links) if (!linkByClient.has(l.client_id)) linkByClient.set(l.client_id, l);

    const withBlocking = clients.map((c) => {
      const period = periodByClient.get(c.id) ?? null;
      const its = period ? itemsByPeriod.get(period.id) ?? [] : [];
      const link = linkByClient.get(c.id);
      const lastOpenedAt =
        link && link.expires_at.getTime() > now.getTime() ? link.last_opened_at : null;
      return {
        ...c,
        period,
        openCount: its.filter((i) => isOpen(i.state)).length,
        totalItems: its.length,
        lastOpenedAt: lastOpenedAt ? lastOpenedAt.toISOString() : null,
        answeredCount: its.filter((i) => i.state === "answered").length,
      };
    });

    // Most blocking first, then whoever has the most items.
    withBlocking.sort((a, b) => b.openCount - a.openCount || b.totalItems - a.totalItems);

    return {
      clients: withBlocking.map((c) => this.presentClient(c)),
      rollup: this.buildRollup(withBlocking, itemsByPeriod, now),
    };
  }

  private emptyRollup() {
    return { documentsOpen: 0, transactionsOpen: 0, neverOpened: [], notChased: [], oldest: null };
  }

  private buildRollup(
    withBlocking: Array<{
      name: string;
      openCount: number;
      lastOpenedAt: string | null;
      period: { id: string; status: string } | null;
    }>,
    itemsByPeriod: Map<string, Array<{ title: string; type: string; state: string; created_at: Date; close_period_id: string }>>,
    now: Date,
  ) {
    const blocking = withBlocking.filter((c) => c.openCount > 0);
    const rollup = {
      documentsOpen: 0,
      transactionsOpen: 0,
      neverOpened: blocking.filter((c) => !c.lastOpenedAt).map((c) => c.name),
      notChased: blocking.filter((c) => c.period?.status !== "chasing").map((c) => c.name),
      oldest: null as { client: string; title: string; days: number } | null,
    };

    const nameByPeriod = new Map(blocking.map((c) => [c.period?.id ?? "", c.name] as const));
    for (const c of blocking) {
      const its = c.period ? itemsByPeriod.get(c.period.id) ?? [] : [];
      for (const row of its) {
        if (!isOpen(row.state)) continue;
        if (row.type === "document") rollup.documentsOpen += 1;
        else rollup.transactionsOpen += 1;
        const days = Math.floor((now.getTime() - row.created_at.getTime()) / 86_400_000);
        if (!rollup.oldest || days > rollup.oldest.days) {
          rollup.oldest = {
            client: nameByPeriod.get(row.close_period_id) ?? "A client",
            title: row.title,
            days,
          };
        }
      }
    }
    return rollup;
  }

  /** Match the frontend's ClientWithBlocking: the full client row plus the
   *  derived fields, with dates as ISO strings. */
  private presentClient(c: {
    id: string; firm_id: string; name: string; email: string; phone: string | null;
    qbo_realm_id: string | null; default_template_id: string | null; notes: string | null;
    auto_chase: boolean; close_day: number | null; created_at: Date;
    period: { id: string; client_id: string; month: Date; status: string; chase_started_at: Date | null; created_at: Date } | null;
    openCount: number; totalItems: number; lastOpenedAt: string | null; answeredCount: number;
  }) {
    return {
      id: c.id,
      firm_id: c.firm_id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      qbo_realm_id: c.qbo_realm_id,
      default_template_id: c.default_template_id,
      notes: c.notes,
      auto_chase: c.auto_chase,
      close_day: c.close_day,
      created_at: c.created_at.toISOString(),
      period: c.period
        ? {
            id: c.period.id,
            client_id: c.period.client_id,
            month: c.period.month.toISOString().slice(0, 10),
            status: c.period.status,
            chase_started_at: c.period.chase_started_at ? c.period.chase_started_at.toISOString() : null,
            created_at: c.period.created_at.toISOString(),
          }
        : null,
      openCount: c.openCount,
      totalItems: c.totalItems,
      lastOpenedAt: c.lastOpenedAt,
      answeredCount: c.answeredCount,
    };
  }
}
