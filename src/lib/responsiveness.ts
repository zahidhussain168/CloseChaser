import { createClient } from "@/lib/supabase/server";
import type { Client, ClosePeriod, Item } from "@/lib/types";

/**
 * Client Responsiveness Score.
 *
 * A per-client grade (A-F) built from three signals we already collect across
 * every past close: how fast they answer, how much they finish, and how many
 * nudges it takes. It turns RuledOff's history into a visible reason to keep a
 * good client and to front-load a chronic slow one. New clients (too little
 * history) are shown as "New" rather than graded on noise.
 */

export type Grade = "A" | "B" | "C" | "D" | "F" | "New";

export type ClientScore = {
  clientId: string;
  name: string;
  grade: Grade;
  /** 0-100 composite, or null when ungraded (new). */
  score: number | null;
  avgResponseDays: number | null;
  completionRate: number; // 0-1
  nudgesPerItem: number | null;
  sampleSize: number; // answered items the score is based on
};

const DAY = 86_400_000;

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function gradeFor(score: number): Grade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export async function getResponsivenessScores(): Promise<ClientScore[]> {
  const supabase = createClient();

  const { data: clientRows } = await supabase.from("clients").select("id, name").order("created_at", { ascending: true });
  const clients = (clientRows as Pick<Client, "id" | "name">[] | null) ?? [];
  if (clients.length === 0) return [];
  const ids = clients.map((c) => c.id);

  const { data: periodRows } = await supabase.from("close_periods").select("id, client_id").in("client_id", ids);
  const periods = (periodRows as Pick<ClosePeriod, "id" | "client_id">[] | null) ?? [];
  const clientByPeriod = new Map(periods.map((p) => [p.id, p.client_id]));
  const periodIds = periods.map((p) => p.id);
  if (periodIds.length === 0) return clients.map((c) => ungraded(c));

  const { data: itemRows } = await supabase
    .from("items")
    .select("close_period_id, state, created_at, answered_at")
    .in("close_period_id", periodIds);
  const items = (itemRows as Pick<Item, "close_period_id" | "state" | "created_at" | "answered_at">[] | null) ?? [];

  // Reminders sent, counted per client via their periods, to derive nudges/item.
  const { data: remRows } = await supabase
    .from("reminders")
    .select("close_period_id, sent_at")
    .in("close_period_id", periodIds)
    .not("sent_at", "is", null);
  const reminders = (remRows as { close_period_id: string; sent_at: string | null }[] | null) ?? [];

  type Agg = { total: number; answered: number; latencies: number[]; nudges: number };
  const byClient = new Map<string, Agg>();
  const get = (id: string) => {
    let a = byClient.get(id);
    if (!a) {
      a = { total: 0, answered: 0, latencies: [], nudges: 0 };
      byClient.set(id, a);
    }
    return a;
  };

  for (const it of items) {
    const cid = clientByPeriod.get(it.close_period_id);
    if (!cid) continue;
    const a = get(cid);
    a.total += 1;
    if (it.answered_at) {
      a.answered += 1;
      a.latencies.push(Math.max(0, (new Date(it.answered_at).getTime() - new Date(it.created_at).getTime()) / DAY));
    }
  }
  for (const r of reminders) {
    const cid = clientByPeriod.get(r.close_period_id);
    if (!cid) continue;
    get(cid).nudges += 1;
  }

  return clients.map((c) => {
    const a = byClient.get(c.id);
    if (!a || a.answered < 2) return ungraded(c);

    const avg = a.latencies.reduce((s, x) => s + x, 0) / a.latencies.length;
    const completion = a.total ? a.answered / a.total : 0;
    const nudgesPerItem = a.answered ? a.nudges / a.answered : 0;

    const speed = clamp(100 - avg * 12); // 0d -> 100, ~8d -> 0
    const comp = clamp(completion * 100);
    const eff = clamp(100 - Math.max(0, nudgesPerItem - 1) * 30); // 1 nudge -> 100
    const score = Math.round(0.4 * speed + 0.4 * comp + 0.2 * eff);

    return {
      clientId: c.id,
      name: c.name,
      grade: gradeFor(score),
      score,
      avgResponseDays: Math.round(avg * 10) / 10,
      completionRate: Math.round(completion * 100) / 100,
      nudgesPerItem: Math.round(nudgesPerItem * 10) / 10,
      sampleSize: a.answered,
    };
  });
}

function ungraded(c: { id: string; name: string }): ClientScore {
  return {
    clientId: c.id,
    name: c.name,
    grade: "New",
    score: null,
    avgResponseDays: null,
    completionRate: 0,
    nudgesPerItem: null,
    sampleSize: 0,
  };
}

export const GRADE_COLOR: Record<Grade, { color: string; tint: string }> = {
  A: { color: "var(--success)", tint: "var(--success-tint)" },
  B: { color: "var(--success)", tint: "var(--success-tint)" },
  C: { color: "#b45309", tint: "var(--warning-tint)" },
  D: { color: "#b45309", tint: "var(--warning-tint)" },
  F: { color: "var(--danger)", tint: "var(--danger-tint)" },
  New: { color: "var(--ink-muted)", tint: "var(--surface-2)" },
};
