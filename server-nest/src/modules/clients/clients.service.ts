import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { TenantService } from "../../common/tenant.service";
import type { CreateClientDto, UpdateClientDto } from "./dto";

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
  ) {}

  async list(userId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    return this.prisma.db.clients.findMany({
      where: { firm_id: firmId },
      orderBy: { created_at: "asc" },
      select: {
        id: true, name: true, email: true, phone: true, notes: true,
        close_day: true, auto_chase: true, qbo_realm_id: true, created_at: true,
      },
    });
  }

  async get(userId: string, clientId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId);
    return this.prisma.db.clients.findFirst({
      where: { id: clientId, firm_id: firmId },
      select: {
        id: true, name: true, email: true, phone: true, notes: true,
        close_day: true, auto_chase: true, qbo_realm_id: true, created_at: true,
      },
    });
  }

  async create(userId: string, dto: CreateClientDto) {
    const firmId = await this.tenant.firmIdForUser(userId);
    return this.prisma.db.clients.create({
      // firm_id comes from the token, never from the request body.
      data: {
        firm_id: firmId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? null,
        notes: dto.notes ?? null,
        close_day: dto.closeDay ?? null,
        // Preserve the realm id the add-client form can set. The direct-Supabase
        // path kept it, so the migrated write must too, or it is a regression.
        qbo_realm_id: dto.qboRealmId || null,
      },
      select: { id: true, name: true, email: true, phone: true, notes: true, close_day: true },
    });
  }

  async update(userId: string, clientId: string, dto: UpdateClientDto) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId);
    return this.prisma.db.clients.update({
      where: { id: clientId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.notes !== undefined && { notes: dto.notes || null }),
        ...(dto.closeDay !== undefined && { close_day: dto.closeDay ?? null }),
      },
      select: { id: true, name: true, email: true, phone: true, notes: true, close_day: true },
    });
  }

  async remove(userId: string, clientId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId);
    await this.prisma.db.clients.delete({ where: { id: clientId } });
    return { deleted: true };
  }

  /**
   * Everything the client-detail screen needs in one call: the full client, the
   * current month's close period, its items, and whether a live magic link
   * exists.
   *
   * Like the page it replaces, this GETs-or-CREATES the current month's period,
   * seeding it from the client's default template when it is brand new. That
   * write-on-read is inherited behaviour, kept identical so the migrated screen
   * behaves exactly as before.
   */
  async detail(userId: string, clientId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId); // 404s if not this firm's

    const client = await this.prisma.db.clients.findUnique({ where: { id: clientId } });
    if (!client) return null;

    const period = await this.ensureCurrentPeriod(clientId, client.default_template_id);

    const [items, link] = await Promise.all([
      this.prisma.db.items.findMany({
        where: { close_period_id: period.id },
        orderBy: { created_at: "asc" },
      }),
      this.prisma.db.magic_links.findFirst({
        where: { client_id: clientId, revoked_at: null },
        select: { id: true },
      }),
    ]);

    return {
      client: this.presentClient(client),
      period: this.presentPeriod(period),
      items: items.map((i) => this.presentItem(i)),
      hasLink: Boolean(link),
    };
  }

  /** The current calendar month, as the date the period column stores. */
  private currentMonth(now = new Date()): Date {
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    return new Date(`${y}-${m}-01T00:00:00Z`);
  }

  private async ensureCurrentPeriod(clientId: string, templateId: string | null) {
    const month = this.currentMonth();
    const existing = await this.prisma.db.close_periods.findFirst({
      where: { client_id: clientId, month },
    });
    if (existing) return existing;

    try {
      const created = await this.prisma.db.close_periods.create({
        data: { client_id: clientId, month, status: "open" },
      });
      if (templateId) await this.seedFromTemplate(templateId, created.id);
      return created;
    } catch {
      // A concurrent request won the unique (client_id, month) race. Re-read
      // theirs rather than fail: the caller only wanted the current period.
      const raced = await this.prisma.db.close_periods.findFirst({
        where: { client_id: clientId, month },
      });
      if (raced) return raced;
      throw new Error("Could not open the current close period");
    }
  }

  private async seedFromTemplate(templateId: string, periodId: string) {
    const tItems = await this.prisma.db.template_items.findMany({
      where: { template_id: templateId },
      orderBy: { position: "asc" },
    });
    if (tItems.length === 0) return;
    await this.prisma.db.items.createMany({
      data: tItems.map((t) => ({
        close_period_id: periodId,
        type: t.type,
        source: "manual",
        title: t.title,
        details: t.note ? { note: t.note } : {},
        state: "requested",
      })),
    });
  }

  private presentClient(c: {
    id: string; firm_id: string; name: string; email: string; phone: string | null;
    qbo_realm_id: string | null; default_template_id: string | null; notes: string | null;
    auto_chase: boolean; close_day: number | null; created_at: Date;
  }) {
    return {
      id: c.id, firm_id: c.firm_id, name: c.name, email: c.email, phone: c.phone,
      qbo_realm_id: c.qbo_realm_id, default_template_id: c.default_template_id,
      notes: c.notes, auto_chase: c.auto_chase, close_day: c.close_day,
      created_at: c.created_at.toISOString(),
    };
  }

  private presentPeriod(p: {
    id: string; client_id: string; month: Date; status: string;
    chase_started_at: Date | null; created_at: Date;
  }) {
    return {
      id: p.id, client_id: p.client_id, month: p.month.toISOString().slice(0, 10),
      status: p.status, chase_started_at: p.chase_started_at ? p.chase_started_at.toISOString() : null,
      created_at: p.created_at.toISOString(),
    };
  }

  private presentItem(i: {
    id: string; close_period_id: string; type: string; source: string;
    qbo_txn_id: string | null; title: string; details: unknown; state: string;
    answer_text: string | null; attachments: unknown; answered_at: Date | null;
    accepted_at: Date | null; qbo_synced_at: Date | null; qbo_sync_error: string | null;
    created_at: Date;
  }) {
    return {
      id: i.id, close_period_id: i.close_period_id, type: i.type, source: i.source,
      qbo_txn_id: i.qbo_txn_id, title: i.title, details: i.details ?? {}, state: i.state,
      answer_text: i.answer_text, attachments: i.attachments ?? [],
      answered_at: i.answered_at ? i.answered_at.toISOString() : null,
      accepted_at: i.accepted_at ? i.accepted_at.toISOString() : null,
      qbo_synced_at: i.qbo_synced_at ? i.qbo_synced_at.toISOString() : null,
      qbo_sync_error: i.qbo_sync_error,
      created_at: i.created_at.toISOString(),
    };
  }
}
