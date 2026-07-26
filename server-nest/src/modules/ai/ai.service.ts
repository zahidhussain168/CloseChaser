import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { TenantService } from "../../common/tenant.service";
import {
  generateChaseEmails, generateClientInsight, isAiConfigured, type GeneratedSet, type ClientInsight,
} from "./ai-generators";

const DAY = 86_400_000;
const OPEN_STATES = ["requested", "nudged"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

@Injectable()
export class AiService {
  private readonly log = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
  ) {}

  /** The full chase-email ladder written in the firm's own voice. */
  async chaseEmails(userId: string, voice: string, tone: string): Promise<GeneratedSet> {
    if (!isAiConfigured()) throw new BadRequestException("AI writing is not set up yet.");
    const firmId = await this.tenant.firmIdForUser(userId);
    const firm = await this.prisma.db.firms.findUnique({ where: { id: firmId }, select: { name: true } });
    const cleanVoice = (voice ?? "").trim().slice(0, 2000);
    const cleanTone = ["Warm", "Balanced", "Firm"].includes(tone) ? tone : "Warm";
    return generateChaseEmails({ firmName: firm?.name ?? "Your firm", voice: cleanVoice, tone: cleanTone });
  }

  /**
   * The per-client analyst read. Gathers the same signals the app does
   * (item states, chase status, reminders sent, link opens), calls the model,
   * and records the suggestion for audit, best effort.
   */
  async clientInsight(userId: string, clientId: string): Promise<ClientInsight> {
    if (!isAiConfigured()) throw new BadRequestException("AI is not set up yet.");
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId);

    const client = await this.prisma.db.clients.findUnique({
      where: { id: clientId },
      select: { name: true },
    });
    const period = await this.prisma.db.close_periods.findFirst({
      where: { client_id: clientId },
      orderBy: { month: "desc" },
    });
    if (!client || !period) throw new BadRequestException("Client not found");

    const items = await this.prisma.db.items.findMany({
      where: { close_period_id: period.id },
      select: { type: true, title: true, state: true },
    });
    const open = items.filter((i) => OPEN_STATES.includes(i.state));
    const answered = items.filter((i) => i.state === "answered").length;
    const accepted = items.filter((i) => i.state === "accepted").length;

    const remindersSent = await this.prisma.db.reminders.count({
      where: { close_period_id: period.id, sent_at: { not: null } },
    });
    const link = await this.prisma.db.magic_links.findFirst({
      where: { client_id: clientId, revoked_at: null },
      orderBy: { created_at: "desc" },
      select: { last_opened_at: true },
    });

    const now = Date.now();
    const insight = await generateClientInsight({
      clientName: client.name,
      month: `${MONTHS[period.month.getUTCMonth()]} ${period.month.getUTCFullYear()}`,
      total: items.length,
      open: open.length,
      answered,
      accepted,
      chasing: period.status === "chasing",
      daysChasing: period.chase_started_at
        ? Math.floor((now - period.chase_started_at.getTime()) / DAY)
        : null,
      remindersSent,
      opened: Boolean(link?.last_opened_at),
      lastOpenedDaysAgo: link?.last_opened_at
        ? Math.floor((now - link.last_opened_at.getTime()) / DAY)
        : null,
      openItems: open.map((i) => ({ type: i.type, title: i.title })),
    });

    // Audit log, best effort, never blocks the response.
    await this.prisma.db.ai_suggestions
      .create({
        data: {
          firm_id: firmId,
          client_id: clientId,
          suggestion: insight as unknown as object,
          reminders_sent: remindersSent,
        },
      })
      .catch(() => undefined);

    return insight;
  }
}
