import { createClient } from "@/lib/supabase/server";
import { monthKey } from "@/lib/format";
import { isOpen } from "@/lib/state";
import type { Client, ClosePeriod, Item } from "@/lib/types";

/**
 * Close Forecast.
 *
 * Every other tool in this space shows present-tense status: what is open right
 * now. RuledOff is the only one that answers the question the bookkeeper is
 * actually anxious about at month-end: "am I going to close on time, and which
 * client is going to make me late?"
 *
 * We do that from data we already collect and nobody else does at this
 * granularity: per-item created -> answered latency across every past month,
 * plus this client's magic-link open history. From that we derive a per-client
 * predicted finish and a risk read, roll it up into a portfolio horizon, and
 * point the bookkeeper at the one client to nudge first.
 *
 * v1 is deliberately a well-calibrated heuristic, not a model: median
 * days-to-answer (the client's own proven behaviour) versus how long the oldest
 * open item has already been sitting, nudged by whether they have opened the
 * link recently. It is honest about low history (confidence: low) and it
 * compounds every close as more history accrues.
 */

export type ForecastRisk = "on_track" | "at_risk" | "stalled";
export type ForecastConfidence = "low" | "medium" | "high";

export type ClientForecast = {
  clientId: string;
  name: string;
  email: string | null;
  openCount: number;
  /** Days the oldest open item has already been waiting. */
  oldestOpenDays: number;
  /** This client's typical days from request to answer, from their own history. */
  medianResponseDays: number;
  /** How many past answers the median is based on. */
  sampleSize: number;
  /** Predicted days from today until this close is ruled off. */
  etaDays: number;
  /** Predicted finish date (ISO). */
  etaDate: string;
  risk: ForecastRisk;
  confidence: ForecastConfidence;
  /** One-line human reason driving the read. */
  driver: string;
  /** True when they opened the link but have not resolved anything (ghost). */
  openedButIdle: boolean;
  isChasing: boolean;
  /** Spread of their response times (days), lower is more predictable. */
  responseStdDev: number | null;
  /** Whether recent responses are getting faster, steady, or slower. */
  trend: "improving" | "steady" | "slipping" | null;
};

export type CloseForecast = {
  /** Active client closes (has open items this month), worst risk first. */
  clients: ClientForecast[];
  onTrack: number;
  atRisk: number;
  stalled: number;
  /** Predicted date the whole book is ruled off (latest client ETA), ISO. */
  horizonDate: string | null;
  /** The single client to chase first, if any need it. */
  chaseFirst: ClientForecast | null;
  /** Month-over-month days-to-close: this month's average vs the recent baseline. */
  daysToClose: { current: number | null; baseline: number | null; delta: number | null };
};

const DAY = 86_400_000;
/** Fallback typical response for a client with too little history to trust. */
const DEFAULT_RESPONSE_DAYS = 4;

function daysBetween(a: number, b: number) {
  return Math.max(0, (a - b) / DAY);
}

function median(nums: number[]): number {
  if (nums.length === 0) return DEFAULT_RESPONSE_DAYS;
  const s = [...nums].sort((x, y) => x - y);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function addDaysIso(fromMs: number, days: number): string {
  return new Date(fromMs + days * DAY).toISOString();
}

/** Inputs the scorer needs for one client, already reduced from raw rows. */
type ScoreInput = {
  clientId: string;
  name: string;
  email: string | null;
  openCount: number;
  oldestOpenDays: number;
  responseSamples: number[];
  /** Response latencies with their answer timestamps, for the trend read. */
  datedSamples?: { d: number; at: number }[];
  answeredCount: number;
  isChasing: boolean;
  lastOpenMs: number | null;
  now: number;
};

/** Population standard deviation, or null for too few samples. */
function stdDev(nums: number[]): number | null {
  if (nums.length < 2) return null;
  const mean = nums.reduce((s, x) => s + x, 0) / nums.length;
  const variance = nums.reduce((s, x) => s + (x - mean) ** 2, 0) / nums.length;
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

/** Compare the recent half of dated responses to the older half. */
function computeTrend(dated?: { d: number; at: number }[]): ClientForecast["trend"] {
  if (!dated || dated.length < 4) return null;
  const sorted = [...dated].sort((a, b) => a.at - b.at);
  const mid = Math.floor(sorted.length / 2);
  const older = sorted.slice(0, mid);
  const recent = sorted.slice(mid);
  const avg = (xs: { d: number }[]) => xs.reduce((s, x) => s + x.d, 0) / xs.length;
  const delta = avg(recent) - avg(older); // negative = faster now
  if (delta <= -0.75) return "improving";
  if (delta >= 0.75) return "slipping";
  return "steady";
}

/**
 * The single source of truth for a client's forecast. Both the portfolio view
 * and the per-client page reduce their rows to a ScoreInput and call this, so
 * the two can never disagree.
 */
function scoreClient(input: ScoreInput): ClientForecast {
  const { now } = input;
  const sampleSize = input.responseSamples.length;
  const medianResponseDays = Math.max(0.5, Math.round(median(input.responseSamples) * 10) / 10);
  const oldestOpenDays = Math.round(input.oldestOpenDays * 10) / 10;
  const lastOpen = input.lastOpenMs;
  const openedButIdle = lastOpen != null && daysBetween(now, lastOpen) <= 14 && input.answeredCount === 0;
  const daysSinceOpen = lastOpen != null ? daysBetween(now, lastOpen) : null;

  let risk: ForecastRisk;
  const overdueRatio = oldestOpenDays / medianResponseDays;
  if (input.isChasing && lastOpen == null && oldestOpenDays >= 3) {
    risk = "stalled";
  } else if (overdueRatio >= 2 && (daysSinceOpen == null || daysSinceOpen >= medianResponseDays)) {
    risk = "stalled";
  } else if (overdueRatio >= 1 || (openedButIdle && (daysSinceOpen ?? 0) >= 2)) {
    risk = "at_risk";
  } else {
    risk = "on_track";
  }

  let etaDays: number;
  if (risk === "on_track") {
    etaDays = Math.max(1, Math.ceil(medianResponseDays - oldestOpenDays));
  } else if (risk === "at_risk") {
    etaDays = Math.max(2, Math.ceil(medianResponseDays));
  } else {
    etaDays = Math.max(4, Math.ceil(medianResponseDays * 1.5));
  }

  const confidence: ForecastConfidence = sampleSize >= 6 ? "high" : sampleSize >= 2 ? "medium" : "low";

  const openedAgo = daysSinceOpen == null ? null : daysSinceOpen < 1 ? "today" : `${Math.round(daysSinceOpen)}d ago`;
  let driver: string;
  if (risk === "stalled" && input.isChasing && lastOpen == null) {
    driver = `Chased ${Math.round(oldestOpenDays)}d, link still not opened`;
  } else if (risk !== "on_track" && openedButIdle) {
    driver = `Opened ${openedAgo}, nothing sent back yet`;
  } else if (risk === "stalled") {
    driver = `${input.openCount} item${input.openCount === 1 ? "" : "s"} sitting ${Math.round(oldestOpenDays)}d, past their usual ${medianResponseDays}d`;
  } else if (risk === "at_risk") {
    driver = `${input.openCount} open, at their usual ${medianResponseDays}d turnaround`;
  } else if (openedAgo != null) {
    driver = `Opened ${openedAgo}, on pace for ~${medianResponseDays}d`;
  } else {
    driver = `${input.openCount} open, typically ${medianResponseDays}d to answer`;
  }

  return {
    clientId: input.clientId,
    name: input.name,
    email: input.email,
    openCount: input.openCount,
    oldestOpenDays,
    medianResponseDays,
    sampleSize,
    etaDays,
    etaDate: addDaysIso(now, etaDays),
    risk,
    confidence,
    driver,
    openedButIdle,
    isChasing: input.isChasing,
    responseStdDev: stdDev(input.responseSamples),
    trend: computeTrend(input.datedSamples),
  };
}

export async function getCloseForecast(): Promise<CloseForecast> {
  const supabase = createClient();
  const now = Date.now();

  const { data: clientRows } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: true });
  const clients = (clientRows as Client[] | null) ?? [];
  if (clients.length === 0) {
    return { clients: [], onTrack: 0, atRisk: 0, stalled: 0, horizonDate: null, chaseFirst: null, daysToClose: { current: null, baseline: null, delta: null } };
  }
  const ids = clients.map((c) => c.id);

  // Every period for the firm (all months) so we can map items -> client for
  // both the current close and the whole response-time history.
  const { data: periodRows } = await supabase
    .from("close_periods")
    .select("id, client_id, month, status, chase_started_at")
    .in("client_id", ids);
  const periods =
    (periodRows as Pick<ClosePeriod, "id" | "client_id" | "month" | "status" | "chase_started_at">[] | null) ?? [];

  const month = monthKey();
  const clientByPeriod = new Map<string, string>();
  const currentPeriodByClient = new Map<string, { id: string; status: ClosePeriod["status"] }>();
  for (const p of periods) {
    clientByPeriod.set(p.id, p.client_id);
    if (p.month === month) currentPeriodByClient.set(p.client_id, { id: p.id, status: p.status });
  }
  if (periods.length === 0) {
    return { clients: [], onTrack: 0, atRisk: 0, stalled: 0, horizonDate: null, chaseFirst: null, daysToClose: { current: null, baseline: null, delta: null } };
  }

  // All items across every period, in one query. Small for a solo firm.
  const { data: itemRows } = await supabase
    .from("items")
    .select("close_period_id, state, type, created_at, answered_at, accepted_at")
    .in("close_period_id", periods.map((p) => p.id));
  const items =
    (itemRows as Pick<Item, "close_period_id" | "state" | "type" | "created_at" | "answered_at" | "accepted_at">[] | null) ??
    [];

  // Per-client response-latency samples (answered - created), from every month.
  const responseSamples = new Map<string, number[]>();
  const datedSamples = new Map<string, { d: number; at: number }[]>();
  // Current-month open item ages per client.
  const currentPeriodIds = new Set([...currentPeriodByClient.values()].map((p) => p.id));
  const openByClient = new Map<string, { count: number; oldestDays: number }>();
  const answeredByClient = new Map<string, number>();

  for (const it of items) {
    const clientId = clientByPeriod.get(it.close_period_id);
    if (!clientId) continue;

    if (it.answered_at) {
      const answeredMs = new Date(it.answered_at).getTime();
      const latency = daysBetween(answeredMs, new Date(it.created_at).getTime());
      const arr = responseSamples.get(clientId) ?? [];
      arr.push(latency);
      responseSamples.set(clientId, arr);
      const dated = datedSamples.get(clientId) ?? [];
      dated.push({ d: latency, at: answeredMs });
      datedSamples.set(clientId, dated);
    }

    if (currentPeriodIds.has(it.close_period_id)) {
      if (isOpen(it.state)) {
        const ageDays = daysBetween(now, new Date(it.created_at).getTime());
        const cur = openByClient.get(clientId) ?? { count: 0, oldestDays: 0 };
        cur.count += 1;
        cur.oldestDays = Math.max(cur.oldestDays, ageDays);
        openByClient.set(clientId, cur);
      } else if (it.state === "answered") {
        answeredByClient.set(clientId, (answeredByClient.get(clientId) ?? 0) + 1);
      }
    }
  }

  // Latest live magic-link open per client.
  const { data: linkRows } = await supabase
    .from("magic_links")
    .select("client_id, last_opened_at, expires_at, revoked_at, created_at")
    .in("client_id", ids)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  const lastOpenByClient = new Map<string, number | null>();
  for (const l of (linkRows as { client_id: string; last_opened_at: string | null; expires_at: string }[] | null) ?? []) {
    if (lastOpenByClient.has(l.client_id)) continue; // first = most recent
    const live = new Date(l.expires_at).getTime() > now;
    lastOpenByClient.set(l.client_id, live && l.last_opened_at ? new Date(l.last_opened_at).getTime() : null);
  }

  const forecasts: ClientForecast[] = [];
  for (const c of clients) {
    const open = openByClient.get(c.id);
    if (!open || open.count === 0) continue; // only active closes with work left

    forecasts.push(
      scoreClient({
        clientId: c.id,
        name: c.name,
        email: c.email,
        openCount: open.count,
        oldestOpenDays: open.oldestDays,
        responseSamples: responseSamples.get(c.id) ?? [],
        datedSamples: datedSamples.get(c.id) ?? [],
        answeredCount: answeredByClient.get(c.id) ?? 0,
        isChasing: currentPeriodByClient.get(c.id)?.status === "chasing",
        lastOpenMs: lastOpenByClient.get(c.id) ?? null,
        now,
      }),
    );
  }

  const riskRank: Record<ForecastRisk, number> = { stalled: 0, at_risk: 1, on_track: 2 };
  forecasts.sort(
    (a, b) => riskRank[a.risk] - riskRank[b.risk] || b.oldestOpenDays - a.oldestOpenDays || b.openCount - a.openCount,
  );

  const onTrack = forecasts.filter((f) => f.risk === "on_track").length;
  const atRisk = forecasts.filter((f) => f.risk === "at_risk").length;
  const stalled = forecasts.filter((f) => f.risk === "stalled").length;
  const horizonDate =
    forecasts.length > 0 ? forecasts.reduce((max, f) => (f.etaDays > max.etaDays ? f : max)).etaDate : null;
  const chaseFirst = forecasts.find((f) => f.risk !== "on_track") ?? null;

  // Month-over-month days-to-close: how long completed closes actually took
  // (chase start -> last item accepted), averaged per month, then this month
  // versus the recent baseline. Answers "are my closes trending faster?"
  const maxAcceptedByPeriod = new Map<string, number>();
  for (const it of items) {
    if (!it.accepted_at) continue;
    const t = new Date(it.accepted_at).getTime();
    maxAcceptedByPeriod.set(it.close_period_id, Math.max(maxAcceptedByPeriod.get(it.close_period_id) ?? 0, t));
  }
  const durationsByMonth = new Map<string, number[]>();
  for (const p of periods) {
    const done = maxAcceptedByPeriod.get(p.id);
    const start = p.chase_started_at ? new Date(p.chase_started_at).getTime() : null;
    if (!done || !start || done < start) continue;
    const arr = durationsByMonth.get(p.month) ?? [];
    arr.push(daysBetween(done, start));
    durationsByMonth.set(p.month, arr);
  }
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null);
  const currentDtc = avg(durationsByMonth.get(month) ?? []);
  const baselineMonths = [...durationsByMonth.keys()].filter((m) => m < month).sort().slice(-3);
  const baselineDurations = baselineMonths.flatMap((m) => durationsByMonth.get(m) ?? []);
  const baselineDtc = avg(baselineDurations);
  const delta = currentDtc != null && baselineDtc != null ? Math.round((currentDtc - baselineDtc) * 10) / 10 : null;

  return {
    clients: forecasts,
    onTrack,
    atRisk,
    stalled,
    horizonDate,
    chaseFirst,
    daysToClose: { current: currentDtc, baseline: baselineDtc, delta },
  };
}

/**
 * The same forecast for a single client, for the client detail page. Returns
 * null when there is nothing to forecast (no open items this month). Scoped to
 * one client so it stays cheap even though it reads every month for history.
 */
export async function getClientForecast(clientId: string): Promise<ClientForecast | null> {
  const supabase = createClient();
  const now = Date.now();

  const { data: clientRow } = await supabase
    .from("clients")
    .select("id, name, email")
    .eq("id", clientId)
    .maybeSingle();
  const client = clientRow as Pick<Client, "id" | "name" | "email"> | null;
  if (!client) return null;

  const { data: periodRows } = await supabase
    .from("close_periods")
    .select("id, month, status")
    .eq("client_id", clientId);
  const periods = (periodRows as Pick<ClosePeriod, "id" | "month" | "status">[] | null) ?? [];
  if (periods.length === 0) return null;

  const month = monthKey();
  const current = periods.find((p) => p.month === month) ?? null;
  const periodIds = periods.map((p) => p.id);

  const { data: itemRows } = await supabase
    .from("items")
    .select("close_period_id, state, type, created_at, answered_at")
    .in("close_period_id", periodIds);
  const items =
    (itemRows as Pick<Item, "close_period_id" | "state" | "type" | "created_at" | "answered_at">[] | null) ??
    [];

  const responseSamples: number[] = [];
  const datedSamples: { d: number; at: number }[] = [];
  let openCount = 0;
  let oldestOpenDays = 0;
  let answeredCount = 0;
  for (const it of items) {
    if (it.answered_at) {
      const answeredMs = new Date(it.answered_at).getTime();
      const d = daysBetween(answeredMs, new Date(it.created_at).getTime());
      responseSamples.push(d);
      datedSamples.push({ d, at: answeredMs });
    }
    if (current && it.close_period_id === current.id) {
      if (isOpen(it.state)) {
        openCount += 1;
        oldestOpenDays = Math.max(oldestOpenDays, daysBetween(now, new Date(it.created_at).getTime()));
      } else if (it.state === "answered") {
        answeredCount += 1;
      }
    }
  }
  if (openCount === 0) return null;

  const { data: linkRows } = await supabase
    .from("magic_links")
    .select("last_opened_at, expires_at, created_at")
    .eq("client_id", clientId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const link = (linkRows as { last_opened_at: string | null; expires_at: string }[] | null)?.[0];
  const lastOpenMs =
    link && new Date(link.expires_at).getTime() > now && link.last_opened_at
      ? new Date(link.last_opened_at).getTime()
      : null;

  return scoreClient({
    clientId: client.id,
    name: client.name,
    email: client.email,
    openCount,
    oldestOpenDays,
    responseSamples,
    datedSamples,
    answeredCount,
    isChasing: current?.status === "chasing",
    lastOpenMs,
    now,
  });
}
