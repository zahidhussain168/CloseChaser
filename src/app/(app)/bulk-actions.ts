"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFirm, ensureCurrentPeriod } from "@/lib/data";
import { requireUserId } from "@/lib/auth";
import { ensureMagicToken } from "@/lib/links";
import { sendChaseEmail } from "@/lib/chase";
import type { Client, Firm, Item } from "@/lib/types";

export type ChaseAllResult = {
  ok: boolean;
  chased: number;
  skipped: number;
  failed: number;
  error?: string;
};

/**
 * Chase every client with open items in one pass: for each, ensure a magic
 * link, put the close into chasing (preserving the original chase start so the
 * reminder cadence is not reset), and send the branded initial email. The whole
 * firm's morning of nagging becomes one click; the daily scheduler keeps
 * following up from there.
 */
export async function chaseAllAction(): Promise<ChaseAllResult> {
  await requireUserId();
  const firm = (await getFirm()) as Firm | null;
  if (!firm) return { ok: false, chased: 0, skipped: 0, failed: 0, error: "No firm found" };

  const supabase = createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: true });
  const rows = (clients as Client[]) ?? [];

  let chased = 0;
  let skipped = 0;
  let failed = 0;

  for (const client of rows) {
    if (!client.email) {
      skipped += 1;
      continue;
    }
    const period = await ensureCurrentPeriod(client.id);
    if (!period) {
      skipped += 1;
      continue;
    }
    const { data: items } = await supabase.from("items").select("*").eq("close_period_id", period.id);
    const allItems = (items as Item[]) ?? [];
    const open = allItems.filter((i) => i.state === "requested" || i.state === "nudged");
    if (open.length === 0) {
      skipped += 1;
      continue;
    }

    const token = await ensureMagicToken(supabase, client.id);
    await supabase
      .from("close_periods")
      .update({
        status: "chasing",
        chase_started_at: period.chase_started_at ?? new Date().toISOString(),
      })
      .eq("id", period.id);

    const result = await sendChaseEmail({
      supabase,
      firm,
      client,
      kind: "initial",
      items: allItems,
      token,
      monthISO: period.month,
    });
    if (result.ok) chased += 1;
    else failed += 1;
  }

  revalidatePath("/dashboard");
  return { ok: true, chased, skipped, failed };
}
