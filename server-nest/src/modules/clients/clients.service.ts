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
}
