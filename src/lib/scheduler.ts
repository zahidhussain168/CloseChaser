import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureMagicToken } from "@/lib/links";
import { sendChaseEmail } from "@/lib/chase";
import { dueReminder, levelLabel } from "@/lib/reminders";
import { kindForLevel } from "@/lib/email/templates";
import { isOpen } from "@/lib/state";
import type { Client, Firm, Item, ClosePeriod } from "@/lib/types";

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

    const due = dueReminder(
      new Date(period.chase_started_at as string),
      sentCount ?? 0,
      now,
    );
    if (!due) {
      report.skipped += 1;
      continue;
    }

    try {
      const { data: firm } = await admin
        .from("firms")
        .select("*")
        .eq("id", clientRow.firm_id)
        .single();
      if (!firm) throw new Error("firm missing");

      const token = await ensureMagicToken(admin, clientRow.id);
      const result = await sendChaseEmail({
        supabase: admin,
        firm: firm as Firm,
        client: clientRow,
        kind: kindForLevel(due.level),
        items,
        token,
        monthISO: period.month,
      });

      await admin.from("reminders").insert({
        client_id: clientRow.id,
        close_period_id: period.id,
        level: due.level,
        channel: "email",
        scheduled_for: now.toISOString(),
        sent_at: result.ok ? now.toISOString() : null,
        stopped_reason: result.ok ? null : `send failed: ${result.error}`,
      });

      // Bump requested → nudged so the UI reflects that we've reached out.
      await admin
        .from("items")
        .update({ state: "nudged" })
        .eq("close_period_id", period.id)
        .eq("state", "requested");

      if (result.ok) {
        report.sent.push({ client: clientRow.name, level: levelLabel(due.level) });
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
