/**
 * Chase cadence: day 2, day 5, day 9, then weekly, escalating by COPY, not by
 * channel. At most one reminder goes out per period per run: the next one due.
 *
 * This mirrors the cadence the deployed app already runs on (firms.reminder_offsets
 * and firms.reminder_weekly_step), so moving the sweep to this backend does not
 * change when any existing client gets chased.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

export type ReminderLevel = 1 | 2 | 3 | 4;

export type Cadence = {
  /** Day offsets from the chase start for the early milestones. */
  offsets: number[];
  /** Spacing once the early milestones are exhausted. */
  weeklyStep: number;
};

export const DEFAULT_CADENCE: Cadence = { offsets: [2, 5, 9], weeklyStep: 7 };

/** Fall back to the default for anything missing or nonsensical. */
export function normaliseCadence(input?: Partial<Cadence> | null): Cadence {
  const offsets = (input?.offsets ?? [])
    .filter((n) => Number.isFinite(n) && n >= 1)
    .map((n) => Math.round(n))
    .sort((a, b) => a - b);
  const step = input?.weeklyStep;
  return {
    offsets: offsets.length ? Array.from(new Set(offsets)) : DEFAULT_CADENCE.offsets,
    weeklyStep:
      typeof step === "number" && step >= 3 && step <= 30
        ? Math.round(step)
        : DEFAULT_CADENCE.weeklyStep,
  };
}

/** Day-offset from chase start for the Nth reminder (0-indexed). */
export function offsetForIndex(index: number, cadence: Cadence = DEFAULT_CADENCE): number {
  const { offsets, weeklyStep } = normaliseCadence(cadence);
  if (index < offsets.length) return offsets[index];
  const stepsAfter = index - (offsets.length - 1);
  return offsets[offsets.length - 1] + stepsAfter * weeklyStep;
}

/** Escalation level of the Nth reminder's copy. */
export function levelForIndex(index: number): ReminderLevel {
  if (index === 0) return 1; // friendly
  if (index === 1) return 2; // specific, with a deadline
  if (index === 2) return 3; // consequence-framed
  return 4; // weekly nudge
}

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

export type DueReminder = { index: number; level: ReminderLevel; offsetDays: number };

/**
 * Whether a reminder is due right now for a chase.
 *
 * Pausing is deliberately NOT handled here: a paused period is filtered out
 * before we get this far, so resuming picks the cadence back up where it was
 * rather than firing every missed reminder at once.
 */
export function dueReminder(
  chaseStartedAt: Date,
  sentCount: number,
  now: Date = new Date(),
  cadence: Cadence = DEFAULT_CADENCE,
): DueReminder | null {
  const nextIndex = sentCount;
  const offsetDays = offsetForIndex(nextIndex, cadence);
  if (daysBetween(chaseStartedAt, now) >= offsetDays) {
    return { index: nextIndex, level: levelForIndex(nextIndex), offsetDays };
  }
  return null;
}

/** Human label for a reminder level (internal / logs). */
export function levelLabel(level: ReminderLevel): string {
  return { 1: "friendly", 2: "specific-deadline", 3: "consequence", 4: "weekly" }[level];
}

/** The UTC date key used by reminders_one_per_day_idx. */
export function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}
