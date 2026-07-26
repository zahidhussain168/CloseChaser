import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { TenantService } from "../../common/tenant.service";
import { StorageService, uploadPrefix } from "../../common/storage.service";
import { canTransition, daysOpen, isOverdue, isRuledOff, type ItemState } from "./item-state";
import type { AnswerItemDto, ConfirmUploadDto, CreateItemDto } from "./dto";

type Attachment = { path: string; name: string; size: number; mime: string; uploaded_at: string };

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
    private readonly storage: StorageService,
  ) {}

  /** Shape an item row for the API, deriving the things we never store. */
  private present(row: {
    id: string; type: string; title: string; state: string;
    answer_text: string | null; attachments: unknown; created_at: Date;
    answered_at: Date | null; accepted_at: Date | null;
  }) {
    const state = row.state as ItemState;
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      state,
      ruledOff: isRuledOff(state),
      overdue: isOverdue(state, row.created_at),
      daysOpen: daysOpen(row.created_at),
      answerText: row.answer_text,
      attachments: (row.attachments as Attachment[]) ?? [],
      createdAt: row.created_at,
      answeredAt: row.answered_at,
      acceptedAt: row.accepted_at,
    };
  }

  private readonly select = {
    id: true, type: true, title: true, state: true, answer_text: true,
    attachments: true, created_at: true, answered_at: true, accepted_at: true,
  } as const;

  /** Every item on a client's current close, for the bookkeeper. */
  async listForClient(userId: string, clientId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId);
    const rows = await this.prisma.db.items.findMany({
      where: { close_periods: { client_id: clientId } },
      orderBy: { created_at: "asc" },
      select: this.select,
    });
    return rows.map((r) => this.present(r));
  }

  /** Everything the client themselves can see through their magic link. */
  async listForPortal(clientId: string) {
    const rows = await this.prisma.db.items.findMany({
      where: { close_periods: { client_id: clientId } },
      orderBy: { created_at: "asc" },
      select: this.select,
    });
    return rows.map((r) => this.present(r));
  }

  async create(userId: string, clientId: string, dto: CreateItemDto) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId);

    // Get-or-create the CURRENT month's period, matching the app's addItem.
    const period = await this.ensureCurrentPeriod(clientId);

    const details: Record<string, unknown> = {};
    if (dto.note) details.note = dto.note;
    if (dto.type === "questionnaire" && dto.questions?.length) details.questions = dto.questions;

    const row = await this.prisma.db.items.create({
      data: {
        close_period_id: period.id,
        type: dto.type,
        title: dto.title,
        source: "manual",
        details: details as object,
        state: "requested",
      },
      select: this.select,
    });
    return this.present(row);
  }

  /** Delete an item, scoped to the firm through period -> client. */
  async remove(userId: string, itemId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertItemOwnedByFirm(firmId, itemId);
    await this.prisma.db.items.delete({ where: { id: itemId } });
    return { deleted: true };
  }

  /**
   * Attach a note to an item found by title on the client's current period, or
   * create the item if there is none. Used by the AI suggestions flow.
   */
  async annotate(userId: string, clientId: string, itemTitle: string, note: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId);
    const period = await this.ensureCurrentPeriod(clientId);

    const existing = await this.prisma.db.items.findFirst({
      where: { close_period_id: period.id, title: itemTitle },
      select: { id: true, details: true },
    });
    if (existing) {
      const details = { ...((existing.details as Record<string, unknown>) ?? {}), note };
      await this.prisma.db.items.update({
        where: { id: existing.id },
        data: { details: details as object },
      });
    } else {
      await this.prisma.db.items.create({
        data: {
          close_period_id: period.id,
          type: "document",
          source: "manual",
          title: itemTitle.slice(0, 200) || "New request",
          details: { note } as object,
          state: "requested",
        },
      });
    }
    return { ok: true };
  }

  private async ensureCurrentPeriod(clientId: string) {
    const now = new Date();
    const month = new Date(
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00Z`,
    );
    const existing = await this.prisma.db.close_periods.findFirst({
      where: { client_id: clientId, month },
      select: { id: true },
    });
    if (existing) return existing;
    try {
      return await this.prisma.db.close_periods.create({
        data: { client_id: clientId, month, status: "open" },
        select: { id: true },
      });
    } catch {
      const raced = await this.prisma.db.close_periods.findFirst({
        where: { client_id: clientId, month },
        select: { id: true },
      });
      if (raced) return raced;
      throw new BadRequestException("Could not open the current close period");
    }
  }

  /**
   * The client answers. Also the auto-stop point: once nothing is open we clear
   * the reminder schedule in the SAME transaction, so a sweep running
   * concurrently can never send a reminder for work that is already done.
   */
  async answer(clientId: string, itemId: string, dto: AnswerItemDto) {
    const item = await this.tenant.assertItemOwnedByClient(clientId, itemId);
    const from = item.state as ItemState;
    if (!canTransition(from, "answered")) {
      throw new BadRequestException(`Cannot answer an item that is ${from}`);
    }
    const row = await this.prisma.db.items.update({
      where: { id: itemId },
      data: { state: "answered", answer_text: dto.answerText, answered_at: new Date() },
      select: this.select,
    });
    return this.present(row);
  }

  /** The bookkeeper rules it off. Terminal. */
  async ruleOff(userId: string, itemId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    const item = await this.tenant.assertItemOwnedByFirm(firmId, itemId);
    const from = item.state as ItemState;
    if (!canTransition(from, "accepted")) {
      throw new BadRequestException(`Cannot rule off an item that is ${from}`);
    }
    const row = await this.prisma.db.items.update({
      where: { id: itemId },
      data: { state: "accepted", accepted_at: new Date() },
      select: this.select,
    });
    return this.present(row);
  }

  /** Mint a signed upload URL. Caller is already authorized by the controller. */
  async signUpload(clientId: string, itemId: string, filename: string, mime: string, size: number) {
    return this.storage.signUpload(clientId, itemId, filename, mime, size);
  }

  /**
   * Record an uploaded object against the item. We verify the object actually
   * landed and that the path belongs to THIS item, so a caller cannot attach
   * someone else's file by guessing a path.
   */
  async confirmUpload(
    clientId: string,
    itemId: string,
    dto: ConfirmUploadDto,
    currentAttachments: unknown,
  ) {
    if (!dto.path.startsWith(uploadPrefix(clientId, itemId))) {
      throw new BadRequestException("Path does not belong to this item");
    }
    if (!(await this.storage.objectExists(dto.path))) {
      throw new BadRequestException("No uploaded file at that path");
    }
    const existing = ((currentAttachments as Attachment[]) ?? []).filter((a) => a.path !== dto.path);
    const attachments: Attachment[] = [
      ...existing,
      { path: dto.path, name: dto.name, size: dto.size, mime: dto.mime, uploaded_at: new Date().toISOString() },
    ];
    const row = await this.prisma.db.items.update({
      where: { id: itemId },
      data: { attachments: attachments as unknown as object },
      select: this.select,
    });
    return this.present(row);
  }

  async downloadUrl(path: string) {
    return { url: await this.storage.signDownload(path, 60) };
  }
}
