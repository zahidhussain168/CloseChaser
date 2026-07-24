import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { TenantService } from "../../common/tenant.service";
import { MailerService } from "../../common/mailer.service";
import { SuppressionService } from "../../common/suppression.service";
import { MagicLinkService } from "../../common/magic-link.service";
import { chaseEmail } from "./chase-email";
import { dayKey, dueReminder, levelLabel, normaliseCadence, type ReminderLevel } from "./cadence";

/** Item states that still block the close: the client owes us something. */
const OPEN_STATES = ["requested", "nudged"];

export type SweepReport = {
  ranAt: string;
  periodsChecked: number;
  sent: { client: string; level: string }[];
  stopped: { client: string; reason: string }[];
  suppressed: { client: string; email: string }[];
  skipped: number;
  errors: { client: string; error: string }[];
};

@Injectable()
export class RemindersService {
  private readonly log = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
    private readonly mailer: MailerService,
    private readonly suppression: SuppressionService,
    private readonly links: MagicLinkService,
  ) {}

  /**
   * The daily sweep.
   *
   * Two independent guards stop a client ever getting the same reminder twice:
   *
   *  1. `FOR UPDATE SKIP LOCKED` when claiming periods, so two overlapping runs
   *     divide the work rather than both doing all of it.
   *  2. The `reminders_one_per_day_idx` unique index on (close_period_id, day).
   *     Inserting the reminder row IS the claim, so even if two workers somehow
   *     reach the same period, exactly one insert wins and the other skips.
   *
   * The second guard is the one that actually makes this safe, which is why the
   * insert happens BEFORE the email goes out and is committed on its own. The
   * network call never happens inside a held lock.
   */
  async sweep(now: Date = new Date()): Promise<SweepReport> {
    const report: SweepReport = {
      ranAt: now.toISOString(),
      periodsChecked: 0,
      sent: [],
      stopped: [],
      suppressed: [],
      skipped: 0,
      errors: [],
    };

    for (const periodId of await this.claimDuePeriods()) {
      report.periodsChecked += 1;
      try {
        await this.processPeriod(periodId, now, report);
      } catch (e) {
        report.errors.push({ client: periodId, error: (e as Error).message });
        this.log.error(`period ${periodId}: ${(e as Error).message}`);
      }
    }
    return report;
  }

  /**
   * Periods being chased that are not paused. SKIP LOCKED means a concurrent
   * run takes the ones we did not, instead of blocking behind us.
   */
  private async claimDuePeriods(): Promise<string[]> {
    const rows = await this.prisma.db.$queryRaw<{ id: string }[]>`
      select id
        from close_periods
       where status = 'chasing'
         and paused_at is null
         and chase_started_at is not null
       order by chase_started_at
       limit 500
         for update skip locked
    `;
    return rows.map((r) => r.id);
  }

  private async processPeriod(periodId: string, now: Date, report: SweepReport) {
    const period = await this.prisma.db.close_periods.findUnique({
      where: { id: periodId },
      select: {
        id: true,
        month: true,
        chase_started_at: true,
        client_id: true,
        clients: {
          select: {
            id: true, name: true, email: true, close_day: true,
            firms: {
              select: {
                name: true, reply_to: true, accent_color: true,
                reminder_offsets: true, reminder_weekly_step: true,
              },
            },
          },
        },
      },
    });
    if (!period?.clients || !period.chase_started_at) return;

    const client = period.clients;
    const firm = client.firms;

    // Auto-stop: the moment nothing is open, the chase is over. This runs
    // before anything else so a finished client is never emailed again.
    const openItems = await this.prisma.db.items.count({
      where: { close_period_id: period.id, state: { in: OPEN_STATES } },
    });
    if (openItems === 0) {
      await this.stopChase(period.id, "all items answered");
      report.stopped.push({ client: client.name, reason: "all items answered" });
      return;
    }

    if (!client.email) {
      report.skipped += 1;
      return;
    }
    if (await this.suppression.isSuppressed(client.email)) {
      report.suppressed.push({ client: client.name, email: client.email });
      report.skipped += 1;
      return;
    }

    const sentCount = await this.prisma.db.reminders.count({
      where: { close_period_id: period.id, sent_at: { not: null } },
    });
    const cadence = normaliseCadence({
      offsets: firm?.reminder_offsets ?? undefined,
      weeklyStep: firm?.reminder_weekly_step ?? undefined,
    });
    const due = dueReminder(period.chase_started_at, sentCount, now, cadence);
    if (!due) {
      report.skipped += 1;
      return;
    }

    // The claim. A unique violation means another worker already has this one.
    const day = dayKey(now);
    let reminderId: string;
    try {
      const row = await this.prisma.db.reminders.create({
        data: {
          client_id: client.id,
          close_period_id: period.id,
          level: due.level,
          channel: "email",
          day: new Date(`${day}T00:00:00Z`),
        },
        select: { id: true },
      });
      reminderId = row.id;
    } catch {
      report.skipped += 1;
      return;
    }

    await this.recordEvent(reminderId, "queued");

    const token = await this.links.ensureFor(client.id);
    const email = chaseEmail({
      level: due.level as ReminderLevel,
      clientName: client.name,
      firmName: firm?.name ?? "Your bookkeeper",
      accent: firm?.accent_color ?? "#5b2333",
      openCount: openItems,
      monthISO: period.month.toISOString(),
      closeDay: client.close_day ?? null,
      link: this.links.url(token),
      to: client.email,
      replyTo: firm?.reply_to ?? null,
    });

    const result = await this.mailer.send(email);
    if (!result.ok) {
      // Release the claim so the next run can retry, unless the address itself
      // is the problem, in which case retrying would only hurt us.
      await this.recordEvent(reminderId, result.hardBounce ? "bounced" : "failed", result.error);
      if (result.hardBounce) {
        await this.suppression.suppress(client.email, "bounce", result.error);
        report.suppressed.push({ client: client.name, email: client.email });
      } else {
        await this.prisma.db.reminders.delete({ where: { id: reminderId } }).catch(() => undefined);
      }
      report.errors.push({ client: client.name, error: result.error });
      return;
    }

    await this.prisma.db.reminders.update({
      where: { id: reminderId },
      data: { sent_at: new Date(), provider_message_id: result.providerMessageId },
    });
    await this.recordEvent(reminderId, "sent");
    report.sent.push({ client: client.name, level: levelLabel(due.level) });
  }

  private async stopChase(periodId: string, reason: string) {
    await this.prisma.db.close_periods.update({
      where: { id: periodId },
      data: { status: "open" },
    });
    await this.prisma.db.reminders.updateMany({
      where: { close_period_id: periodId, sent_at: null },
      data: { stopped_reason: reason },
    });
  }

  private async recordEvent(reminderId: string, type: string, detail?: string) {
    await this.prisma.db.reminder_events
      .create({ data: { reminder_id: reminderId, type, detail } })
      .catch(() => undefined); // telemetry must never break a send
  }

  /** Hold the chase for a client without losing where the cadence was. */
  async setPaused(userId: string, clientId: string, paused: boolean) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId);
    const { count } = await this.prisma.db.close_periods.updateMany({
      where: { client_id: clientId, status: "chasing" },
      data: { paused_at: paused ? new Date() : null },
    });
    if (count === 0) throw new NotFoundException("No chase in progress for this client");
    return { clientId, paused };
  }

  /** What the bookkeeper has been sending, newest first. */
  async history(userId: string, clientId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId);
    const rows = await this.prisma.db.reminders.findMany({
      where: { client_id: clientId },
      orderBy: { created_at: "desc" },
      take: 50,
      select: {
        id: true, level: true, channel: true, sent_at: true,
        stopped_reason: true, created_at: true,
        reminder_events: { orderBy: { occurred_at: "desc" }, select: { type: true, occurred_at: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      level: r.level,
      levelLabel: levelLabel(r.level as ReminderLevel),
      channel: r.channel,
      sentAt: r.sent_at,
      stoppedReason: r.stopped_reason,
      createdAt: r.created_at,
      events: r.reminder_events,
    }));
  }
}
