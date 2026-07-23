import "server-only";
import { monthKey } from "@/lib/format";
import { seedPeriodFromTemplate } from "@/lib/data";
import { ensureMagicToken } from "@/lib/links";
import { sendChaseEmail } from "@/lib/chase";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Client, Firm, Item, ClosePeriod } from "@/lib/types";

type Admin = ReturnType<typeof createAdminClient>;

export type RecurringReport = { generated: number; chased: number; errors: number };

/**
 * Recurring monthly requests. For every client that has opted in (auto_chase)
 * and set a default template, make sure this month's close exists and is seeded
 * from that template, then start the chase automatically. Idempotent and run
 * daily by the cron: a client is only generated/chased once per month because
 * chase_started_at is set on the first pass and skipped thereafter.
 */
export async function runRecurring(admin: Admin, now: Date = new Date()): Promise<RecurringReport> {
  const report: RecurringReport = { generated: 0, chased: 0, errors: 0 };
  const month = monthKey();

  const { data: clients } = await admin
    .from("clients")
    .select("*")
    .eq("auto_chase", true)
    .not("default_template_id", "is", null);
  const rows = (clients as Client[]) ?? [];

  for (const client of rows) {
    try {
      const { data: existing } = await admin
        .from("close_periods")
        .select("*")
        .eq("client_id", client.id)
        .eq("month", month)
        .maybeSingle();
      let period = existing as ClosePeriod | null;

      if (!period) {
        const { data: created } = await admin
          .from("close_periods")
          .insert({ client_id: client.id, month, status: "open" })
          .select("*")
          .single();
        period = created as ClosePeriod;
        if (client.default_template_id) {
          await seedPeriodFromTemplate(admin, client.default_template_id, period.id);
        }
        report.generated += 1;
      }

      const { data: itemsData } = await admin.from("items").select("*").eq("close_period_id", period.id);
      const items = (itemsData as Item[]) ?? [];
      const open = items.filter((i) => i.state === "requested" || i.state === "nudged");

      // Start the chase once, only if there is something to chase and it has not
      // already begun this month.
      if (open.length > 0 && period.status !== "chasing" && !period.chase_started_at && client.email) {
        const { data: firm } = await admin.from("firms").select("*").eq("id", client.firm_id).single();
        const token = await ensureMagicToken(admin, client.id);
        await admin
          .from("close_periods")
          .update({ status: "chasing", chase_started_at: now.toISOString() })
          .eq("id", period.id);
        const res = await sendChaseEmail({
          supabase: admin,
          firm: firm as Firm,
          client,
          kind: "initial",
          items,
          token,
          monthISO: period.month,
        });
        if (res.ok) report.chased += 1;
        else report.errors += 1;
      }
    } catch {
      report.errors += 1;
    }
  }

  return report;
}
