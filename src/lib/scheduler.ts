import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureMagicToken } from "@/lib/links";
import { sendChaseEmail } from "@/lib/chase";
import { dueReminder, levelLabel, normaliseCadence } from "@/lib/reminders";
import { kindForLevel } from "@/lib/email/templates";
import { isOpen } from "@/lib/state";
import { planEscalation, smsChaseBody } from "@/lib/escalation";
import { firmIsPro } from "@/lib/pro-features";
import { isSmsEnabled, sendSms } from "@/lib/sms/twilio";
import { magicLinkUrl } from "@/lib/tokens";
import { serverEnv } from "@/lib/env";
import type { Client, Firm, Item, ClosePeriod } from "@/lib/types";

/** The hard close deadline for a period, from the client's close_day (books
 * close on the Nth of the month after the close month). Null if none set. */
function periodDeadlineISO(monthISO: string, closeDay: number | null | undefined): string | null {
  if (!closeDay) return null;
  const pm = new Date(monthISO);
  return new Date(Date.UTC(pm.getUTCFullYear(), pm.getUTCMonth() + 1, closeDay)).toISOString();
}

export type SchedulerReport = {
  ranAt: string;
  periodsChecked: number;
  sent: { client: string; level: string }[];
  stopped: { client: string; reason: string }[];
  skipped: number;
  errors: { client: string; error: string }[];
};

/**
 * Daily reminder run. For each period being chased with open items, sends the
 * next due reminder (day 2/5/9 → weekly), escalating by copy. Auto-stops the
 * moment a period has no open items left.
 */
export async function runReminders(now: Date = new Date()): Promise<SchedulerReport> {
  const admin = createAdminClient();
  const report: SchedulerReport = {
    ranAt: now.toISOString(),
    periodsChecked: 0,
    sent: [],
    stopped: [],
    skipped: 0,
    errors: [],
  };

  const { data: periods } = await admin
    .from("close_periods")
    .select("*")
    .eq("status", "chasing")
    .not("chase_started_at", "is", null);

  for (const period of (periods as ClosePeriod[]) ?? []) {
    report.periodsChecked += 1;

    const { data: client } = await admin
      .from("clients")
      .select("*")
      .eq("id", period.client_id)
      .single();
    if (!client) continue;
    const clientRow = client as Client;

    const { data: itemsData } = await admin
      .from("items")
      .select("*")
      .eq("close_period_id", period.id);
    const items = (itemsData as Item[]) ?? [];
    const open = items.filter((i) => isOpen(i.state));

    // Auto-stop: nothing left to chase.
    if (open.length === 0) {
      const allAccepted =
        items.length > 0 && items.every((i) => i.state === "accepted");
      await admin
        .from("close_periods")
        .update({ status: allAccepted ? "closed" : "open" })
        .eq("id", period.id);
      report.stopped.push({
        client: clientRow.name,
        reason: allAccepted ? "closed" : "all items answered",
      });
      continue;
    }

    // How many reminders have already gone out for this period?
    const { count: sentCount } = await admin
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("close_period_id", period.id)
      .not("sent_at", "is", null);

    // The firm is loaded before the due check because it carries the cadence.
    const { data: firm } = await admin
      .from("firms")
      .select("*")
      .eq("id", clientRow.firm_id)
      .single();
    if (!firm) continue;

    // Auto-escalating reminders are a Pro feature. A Free firm can still send a
    // chase by hand from the client page; the scheduler just does not follow up
    // for them. Trial and paid plans are unaffected.
    if (!firmIsPro(firm as unknown as Firm)) {
      report.skipped += 1;
      continue;
    }

    const due = dueReminder(
      new Date(period.chase_started_at as string),
      sentCount ?? 0,
      now,
      normaliseCadence({
        offsets: (firm as { reminder_offsets?: number[] }).reminder_offsets,
        weeklyStep: (firm as { reminder_weekly_step?: number }).reminder_weekly_step,
      }),
    );

    // Deadline-aware: work BACKWARD from the close date. On the final day and the
    // day before, force a firm (level 3, consequence) reminder even if the
    // forward cadence has nothing due. The daily-slot claim below still prevents
    // double-contacting if a cadence reminder already went out today.
    const deadlineIso = periodDeadlineISO(period.month, (clientRow as { close_day?: number | null }).close_day);
    const dl = planEscalation(deadlineIso, now.getTime());
    const deadlineDrivenLevel =
      dl.daysToDeadline != null && dl.daysToDeadline >= 0 && dl.daysToDeadline <= 1 ? 3 : null;
    const sendLevel = due ? due.level : deadlineDrivenLevel;
    if (sendLevel == null) {
      report.skipped += 1;
      continue;
    }

    try {
      // Claim today's slot BEFORE sending. The unique (period, day) index means
      // a second overlapping run (or a same-day manual text) loses the race, so
      // we skip rather than double-contacting the client.
      const day = now.toISOString().slice(0, 10);
      const { data: claim, error: claimErr } = await admin
        .from("reminders")
        .insert({
          client_id: clientRow.id,
          close_period_id: period.id,
          level: sendLevel,
          channel: "email",
          scheduled_for: now.toISOString(),
          day,
          sent_at: null,
        })
        .select("id")
        .maybeSingle();
      if (claimErr || !claim) {
        // Already a reminder for this period today → do not send.
        report.skipped += 1;
        continue;
      }

      const token = await ensureMagicToken(admin, clientRow.id);
      const result = await sendChaseEmail({
        supabase: admin,
        firm: firm as Firm,
        client: clientRow,
        kind: kindForLevel(sendLevel),
        items,
        token,
        monthISO: period.month,
      });

      await admin
        .from("reminders")
        .update({
          sent_at: result.ok ? now.toISOString() : null,
          stopped_reason: result.ok ? null : `send failed: ${result.error}`,
        })
        .eq("id", claim.id);

      // Bump requested → nudged so the UI reflects that we've reached out.
      await admin
        .from("items")
        .update({ state: "nudged" })
        .eq("close_period_id", period.id)
        .eq("state", "requested");

      // Deadline-aware channel escalation. If the client has a close deadline
      // and we are within the SMS window, also text them, urgent on the final
      // day. The SMS channel is dormant unless configured, so this is a no-op
      // today and the email above remains the live path. Best-effort: an SMS
      // problem never fails the run.
      if (result.ok && clientRow.phone && dl.channel === "email_sms" && isSmsEnabled()) {
        try {
          await sendSms(
            clientRow.phone,
            smsChaseBody({
              firmName: (firm as Firm).name,
              openCount: open.length,
              url: magicLinkUrl(serverEnv.appUrl, token),
              urgent: dl.urgent,
            }),
          );
        } catch {
          /* SMS is best-effort; the email already went out */
        }
      }

      if (result.ok) {
        report.sent.push({ client: clientRow.name, level: levelLabel(sendLevel) });
      } else {
        report.errors.push({ client: clientRow.name, error: result.error });
      }
    } catch (e) {
      report.errors.push({
        client: clientRow.name,
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }

  return report;
}
