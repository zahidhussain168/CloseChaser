import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { TenantService } from "../../common/tenant.service";

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
}
