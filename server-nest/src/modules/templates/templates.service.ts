import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { TenantService } from "../../common/tenant.service";
import type {
  AddTemplateItemDto, ApplyTemplateDto, CreateTemplateDto, CreateTemplateWithItemsDto,
  SetDefaultTemplateDto, UpsertEmailTemplateDto,
} from "./dto";

function currentMonth(now = new Date()): Date {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return new Date(`${y}-${m}-01T00:00:00Z`);
}

/**
 * Request templates for the firm, each with its items.
 *
 * A faithful port of the frontend's listTemplates, with one improvement: the
 * original ran one query per template to fetch its items (N+1), this fetches
 * everything in a single include, which matters across the DB-region hop.
 */
@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
  ) {}

  async list(userId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    const templates = await this.prisma.db.request_templates.findMany({
      where: { firm_id: firmId },
      orderBy: { created_at: "asc" },
      include: { template_items: { orderBy: { position: "asc" } } },
    });

    return templates.map((t) => ({
      id: t.id,
      firm_id: t.firm_id,
      name: t.name,
      created_at: t.created_at.toISOString(),
      items: t.template_items.map((i) => ({
        id: i.id,
        template_id: i.template_id,
        type: i.type,
        title: i.title,
        note: i.note,
        position: i.position,
        created_at: i.created_at.toISOString(),
      })),
    }));
  }

  async create(userId: string, dto: CreateTemplateDto) {
    const firmId = await this.tenant.firmIdForUser(userId);
    const t = await this.prisma.db.request_templates.create({
      data: { firm_id: firmId, name: dto.name },
      select: { id: true, name: true },
    });
    return t;
  }

  /** Create a template and seed its items in one go (starter packs). */
  async createWithItems(userId: string, dto: CreateTemplateWithItemsDto) {
    const firmId = await this.tenant.firmIdForUser(userId);
    const t = await this.prisma.db.request_templates.create({
      data: { firm_id: firmId, name: dto.name },
      select: { id: true },
    });
    await this.prisma.db.template_items.createMany({
      data: dto.items.map((it, i) => ({
        template_id: t.id,
        type: it.type,
        title: it.title,
        note: it.note || null,
        position: i,
      })),
    });
    return { id: t.id, added: dto.items.length };
  }

  async addItem(userId: string, templateId: string, dto: AddTemplateItemDto) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertTemplate(firmId, templateId);
    // New item goes to the end, matching the old count-based position.
    const count = await this.prisma.db.template_items.count({ where: { template_id: templateId } });
    const it = await this.prisma.db.template_items.create({
      data: {
        template_id: templateId,
        type: dto.type,
        title: dto.title,
        note: dto.note || null,
        position: count,
      },
      select: { id: true },
    });
    return it;
  }

  async removeItem(userId: string, itemId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertTemplateItem(firmId, itemId);
    await this.prisma.db.template_items.delete({ where: { id: itemId } });
    return { deleted: true };
  }

  async remove(userId: string, templateId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertTemplate(firmId, templateId);
    await this.prisma.db.request_templates.delete({ where: { id: templateId } });
    return { deleted: true };
  }

  /** Apply a template to a client's current period, seeding its items. */
  async apply(userId: string, templateId: string, dto: ApplyTemplateDto) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertTemplate(firmId, templateId);
    await this.tenant.assertClient(firmId, dto.clientId);

    const period = await this.ensureCurrentPeriod(dto.clientId);
    const tItems = await this.prisma.db.template_items.findMany({
      where: { template_id: templateId },
      orderBy: { position: "asc" },
    });
    if (tItems.length === 0) return { added: 0 };
    await this.prisma.db.items.createMany({
      data: tItems.map((t) => ({
        close_period_id: period.id,
        type: t.type,
        source: "manual",
        title: t.title,
        details: t.note ? { note: t.note } : {},
        state: "requested",
      })),
    });
    return { added: tItems.length };
  }

  async setClientDefault(userId: string, clientId: string, dto: SetDefaultTemplateDto) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId);
    if (dto.templateId) await this.tenant.assertTemplate(firmId, dto.templateId);
    await this.prisma.db.clients.update({
      where: { id: clientId },
      data: { default_template_id: dto.templateId || null },
    });
    return { clientId, defaultTemplateId: dto.templateId || null };
  }

  /** Upsert one of the firm's editable chase-email templates. */
  async upsertEmailTemplate(userId: string, dto: UpsertEmailTemplateDto) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.prisma.db.email_templates.upsert({
      where: { firm_id_kind: { firm_id: firmId, kind: dto.kind } },
      create: { firm_id: firmId, kind: dto.kind, subject: dto.subject, body: dto.body },
      update: { subject: dto.subject, body: dto.body, updated_at: new Date() },
    });
    return { ok: true };
  }

  private async ensureCurrentPeriod(clientId: string) {
    const month = currentMonth();
    const existing = await this.prisma.db.close_periods.findFirst({
      where: { client_id: clientId, month },
    });
    if (existing) return existing;
    try {
      return await this.prisma.db.close_periods.create({
        data: { client_id: clientId, month, status: "open" },
      });
    } catch {
      const raced = await this.prisma.db.close_periods.findFirst({
        where: { client_id: clientId, month },
      });
      if (raced) return raced;
      throw new BadRequestException("Could not open the current close period");
    }
  }
}
