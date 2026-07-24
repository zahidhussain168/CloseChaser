"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/auth";
import { getClientDetail } from "@/lib/data";
import { getActiveLink } from "@/lib/links";
import { formatMonth } from "@/lib/format";
import { generateClientInsight, isAiConfigured, type ClientInsight } from "@/lib/ai/insight";
import { isScale } from "@/lib/entitlements";
import type { Item } from "@/lib/types";

export type InsightResult =
  | { ok: true; insight: ClientInsight }
  | { ok: false; error: string };

const DAY = 86_400_000;

/** Ask the AI close analyst for a read on this client's month-end status. */
export async function clientInsightAction(clientId: string): Promise<InsightResult> {
  await requireUserId();
  if (!(await isScale())) {
    return { ok: false, error: "The AI Close Analyst is a Scale feature. Upgrade to use it." };
  }
  if (!isAiConfigured()) return { ok: false, error: "AI is not set up yet." };

  const detail = await getClientDetail(clientId);
  if (!detail) return { ok: false, error: "Client not found." };
  const { client, period, items } = detail;
  const its = items as Item[];

  const open = its.filter((i) => i.state === "requested" || i.state === "nudged");
  const answered = its.filter((i) => i.state === "answered").length;
  const accepted = its.filter((i) => i.state === "accepted").length;

  const supabase = createClient();
  const link = await getActiveLink(supabase, clientId);
  const { count } = await supabase
    .from("reminders")
    .select("id", { count: "exact", head: true })
    .eq("close_period_id", period.id)
    .not("sent_at", "is", null);

  const daysChasing = period.chase_started_at
    ? Math.floor((Date.now() - new Date(period.chase_started_at).getTime()) / DAY)
    : null;
  const lastOpenedDaysAgo = link?.lastOpenedAt
    ? Math.floor((Date.now() - new Date(link.lastOpenedAt).getTime()) / DAY)
    : null;

  try {
    const insight = await generateClientInsight({
      clientName: client.name,
      month: formatMonth(period.month),
      total: its.length,
      open: open.length,
      answered,
      accepted,
      chasing: period.status === "chasing",
      daysChasing,
      remindersSent: count ?? 0,
      opened: Boolean(link?.lastOpenedAt),
      lastOpenedDaysAgo,
      openItems: open.map((i) => ({ type: i.type, title: i.title })),
    });

    // Audit log: record what the analyst suggested (best-effort, never blocks).
    try {
      await supabase.from("ai_suggestions").insert({
        firm_id: client.firm_id,
        client_id: clientId,
        suggestion: insight as unknown as Record<string, unknown>,
        reminders_sent: count ?? 0,
      });
    } catch {
      /* logging is best-effort */
    }

    return { ok: true, insight };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "The AI read failed. Try again." };
  }
}

/**
 * Close the audit loop: when the bookkeeper takes the analyst's one-click
 * action, flag the most recent suggestion for this client as acted, so the log
 * records suggested-versus-acted, not just what was proposed.
 */
export async function markSuggestionActedAction(clientId: string): Promise<void> {
  await requireUserId();
  const supabase = createClient();
  const { data } = await supabase
    .from("ai_suggestions")
    .select("id")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const id = (data as { id: string } | null)?.id;
  if (id) await supabase.from("ai_suggestions").update({ acted: true }).eq("id", id);
}
