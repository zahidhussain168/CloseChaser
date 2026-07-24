import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/**
 * Tenant scoping.
 *
 * Every read and write is filtered by the firm that the authenticated user
 * OWNS. Ids arriving from the client are treated as untrusted input: we never
 * fetch by id alone and then check ownership afterwards, because that leaks
 * existence. Instead ownership is part of the WHERE clause, so a mismatched id
 * simply returns nothing and we answer 404.
 *
 * RLS stays enabled underneath as defence in depth; this is the application
 * layer, not a replacement for it.
 */
@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  /** The firm owned by this Supabase user. */
  async firmIdForUser(userId: string): Promise<string> {
    const firm = await this.prisma.db.firms.findFirst({
      where: { owner_id: userId },
      select: { id: true },
    });
    if (!firm) throw new ForbiddenException("No firm for this account");
    return firm.id;
  }

  /** Resolve a client id, scoped to the firm. Throws 404 if it is not theirs. */
  async assertClient(firmId: string, clientId: string): Promise<{ id: string }> {
    const client = await this.prisma.db.clients.findFirst({
      where: { id: clientId, firm_id: firmId },
      select: { id: true },
    });
    if (!client) throw new NotFoundException("Client not found");
    return client;
  }

  /**
   * Resolve an item id through period -> client -> firm. One query, ownership
   * in the WHERE clause.
   */
  async assertItemOwnedByFirm(firmId: string, itemId: string) {
    const item = await this.prisma.db.items.findFirst({
      where: { id: itemId, close_periods: { clients: { firm_id: firmId } } },
      select: { ...this.itemSelect },
    });
    if (!item) throw new NotFoundException("Item not found");
    return { ...item, clientId: item.close_periods.client_id };
  }

  /** Resolve an item for a PORTAL principal: must belong to that client. */
  async assertItemOwnedByClient(clientId: string, itemId: string) {
    const item = await this.prisma.db.items.findFirst({
      where: { id: itemId, close_periods: { client_id: clientId } },
      select: { ...this.itemSelect },
    });
    if (!item) throw new NotFoundException("Item not found");
    return { ...item, clientId: item.close_periods.client_id };
  }

  /**
   * The client id comes back with every item because storage paths are keyed
   * by client, matching the layout the existing app already writes.
   */
  private readonly itemSelect = {
    id: true,
    close_period_id: true,
    state: true,
    attachments: true,
    close_periods: { select: { client_id: true } },
  } as const;
}
