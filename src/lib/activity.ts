import {
  normaliseCadence,
  offsetForIndex,
  levelForIndex,
  levelLabel,
  type Cadence,
} from "@/lib/reminders";

export type ActivityTone = "neutral" | "brand" | "success" | "warning";
export type ActivityEvent = { at: string; label: string; tone: ActivityTone };

const DAY_MS = 86_400_000;

/** A newest-first timeline of what has happened on this close, from existing data. */
export function buildActivity(input: {
  chaseStartedAt: string | null;
  lastOpenedAt: string | null;
  items: { title: string; answered_at: string | null; accepted_at: string | null }[];
  reminders: { sent_at: string | null; channel: string }[];
}): ActivityEvent[] {
  const ev: ActivityEvent[] = [];
  if (input.chaseStartedAt) ev.push({ at: input.chaseStartedAt, label: "Chase started", tone: "brand" });
  if (input.lastOpenedAt) ev.push({ at: input.lastOpenedAt, label: "Client opened the link", tone: "neutral" });
  for (const r of input.reminders) {
    if (!r.sent_at) continue;
    ev.push({
      at: r.sent_at,
      label: r.channel === "manual_text" ? "You texted the client" : "Reminder sent",
      tone: "warning",
    });
  }
  for (const it of input.items) {
    if (it.answered_at) ev.push({ at: it.answered_at, label: `Answered: ${it.title}`, tone: "neutral" });
    if (it.accepted_at) ev.push({ at: it.accepted_at, label: `Ruled off: ${it.title}`, tone: "success" });
  }
  return ev.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

/** When the next reminder will go out and which escalation level it will use. */
export function nextReminderInfo(input: {
  chaseStartedAt: string | null;
  sentCount: number;
  cadence: Cadence;
  now?: Date;
}): { inDays: number; level: number; label: string } | null {
  if (!input.chaseStartedAt) return null;
  const now = input.now ?? new Date();
  const cad = normaliseCadence(input.cadence);
  const offset = offsetForIndex(input.sentCount, cad);
  const due = new Date(input.chaseStartedAt).getTime() + offset * DAY_MS;
  const inDays = Math.max(0, Math.ceil((due - now.getTime()) / DAY_MS));
  return { inDays, level: levelForIndex(input.sentCount), label: levelLabel(levelForIndex(input.sentCount)) };
}
