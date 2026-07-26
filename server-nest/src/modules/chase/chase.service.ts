import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { TenantService } from "../../common/tenant.service";
import { MailerService } from "../../common/mailer.service";
import { MagicLinkService } from "../../common/magic-link.service";
import {
  buildEmailHtml, buildEmailText, DEFAULT_TEMPLATES, EmailItem, EmailKind, EmailTemplate,
  firstName, formatMonth, renderTemplateString, softDeadline,
} from "./chase-templates";

const OPEN_STATES = ["requested", "nudged"];

@Injectable()
export class ChaseService {
  private readonly log = new Logger(ChaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
    private readonly mailer: MailerService,
    private readonly links: MagicLinkService,
  ) {}

  /**
   * Start (or re-send) the initial chase for a client: mark the period chasing,
   * ensure a magic link, render the firm's initial template and send it. A
   * faithful port of fireChaseAction + sendChaseEmail.
   */
  async fire(userId: string, clientId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    await this.tenant.assertClient(firmId, clientId);

    const firm = await this.prisma.db.firms.findUnique({
      where: { id: firmId },
      select: { id: true, name: true, accent_color: true, reply_to: true },
    });
    const client = await this.prisma.db.clients.findUnique({
      where: { id: clientId },
      select: { name: true, email: true },
    });
    if (!firm || !client) throw new BadRequestException("Client not found");
    if (!client.email) return { ok: false as const, error: "This client has no email address" };

    const period = await this.ensureCurrentPeriod(clientId);
    const items = await this.prisma.db.items.findMany({
      where: { close_period_id: period.id },
      select: { title: true, type: true, state: true },
    });
    const open = items.filter((i) => OPEN_STATES.includes(i.state));
    if (open.length === 0) {
      return { ok: false as const, error: "Nothing open to chase. This close is clear." };
    }

    const token = await this.links.ensureFor(clientId);

    // Mark the period chasing (keep the original start if already chasing).
    await this.prisma.db.close_periods.update({
      where: { id: period.id },
      data: {
        status: "chasing",
        chase_started_at: period.chase_started_at ?? new Date(),
      },
    });

    const tpl = await this.loadTemplate(firmId, "initial");
    const monthISO = period.month.toISOString();
    const ctx = {
      firstName: firstName(client.name),
      firmName: firm.name,
      month: formatMonth(monthISO),
      openCount: open.length,
      deadline: softDeadline(),
    };
    const emailItems: EmailItem[] = open.map((i) => ({ title: i.title, type: i.type as EmailItem["type"] }));
    const ctaUrl = this.links.url(token);
    const accent = firm.accent_color || "#C49A2A";

    const result = await this.send({
      to: client.email,
      subject: renderTemplateString(tpl.subject, ctx),
      html: buildEmailHtml({ bodyText: renderTemplateString(tpl.body, ctx), items: emailItems, ctaUrl, firmName: firm.name, accent, month: ctx.month }),
      text: buildEmailText({ bodyText: renderTemplateString(tpl.body, ctx), items: emailItems, ctaUrl, firmName: firm.name }),
      replyTo: firm.reply_to,
    });

    if (!result.ok) return { ok: false as const, error: `Email failed: ${result.error}` };
    return { ok: true as const };
  }

  /** The firm's editable template for this kind, merged over the code default. */
  private async loadTemplate(firmId: string, kind: EmailKind): Promise<EmailTemplate> {
    const row = await this.prisma.db.email_templates.findFirst({
      where: { firm_id: firmId, kind },
      select: { subject: true, body: true },
    });
    return row ?? DEFAULT_TEMPLATES[kind];
  }

  /**
   * Send, with a sandbox redirect. When RESEND_TEST_RECIPIENT is set, every
   * chase goes there instead of the real client, with the intended recipient in
   * the subject. That is on deliberately while the Resend sender is unverified
   * (it can only reach the account owner). Unset it to deliver to real clients.
   */
  private async send(m: { to: string; subject: string; html: string; text: string; replyTo: string | null }) {
    const testTo = process.env.RESEND_TEST_RECIPIENT;
    const redirecting = testTo && testTo !== m.to;
    const to = redirecting ? testTo : m.to;
    const subject = redirecting ? `[to ${m.to}] ${m.subject}` : m.subject;
    if (redirecting) this.log.warn(`chase redirected to ${testTo} (intended ${m.to})`);
    return this.mailer.send({
      to,
      from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
      replyTo: m.replyTo,
      subject,
      html: m.html,
      text: m.text,
    });
  }

  private async ensureCurrentPeriod(clientId: string) {
    const now = new Date();
    const month = new Date(
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00Z`,
    );
    const existing = await this.prisma.db.close_periods.findFirst({
      where: { client_id: clientId, month },
      select: { id: true, month: true, chase_started_at: true },
    });
    if (existing) return existing;
    try {
      return await this.prisma.db.close_periods.create({
        data: { client_id: clientId, month, status: "open" },
        select: { id: true, month: true, chase_started_at: true },
      });
    } catch {
      const raced = await this.prisma.db.close_periods.findFirst({
        where: { client_id: clientId, month },
        select: { id: true, month: true, chase_started_at: true },
      });
      if (raced) return raced;
      throw new BadRequestException("Could not open the current close period");
    }
  }
}
