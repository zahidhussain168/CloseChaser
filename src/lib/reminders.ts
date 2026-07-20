import type { ReminderLevel } from "@/lib/types";

/**
 * Chase cadence: day 2, day 5, day 9, then weekly, escalating by COPY, not by
 * channel. The scheduler sends at most one reminder per run: the next one due.
 *
 * Reminders are counted per close period. Given how many have already gone out,
 * we know the next milestone offset (in days from the chase start) and the
 * escalation level of the copy to use.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Cadence a firm has not customised: day 2, day 5, day 9, then weekly. */
export const DEFAULT_CADENCE: Cadence = { offsets: [2, 5, 9], weeklyStep: 7 };

export type Cadence = {
  /** Day offsets from the chase start for the early milestones. */
  offsets: number[];
  /** Spacing once the early milestones are exhausted. */
  weeklyStep: number;
};

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
  // Past the early milestones, keep stepping by the weekly interval.
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
 * Decide whether a reminder is due right now for a chase.
 * @param chaseStartedAt when the initial chase email was sent
 * @param sentCount how many reminders have already been sent for this period
 * @param now current time
 * @returns the reminder to send, or null if none is due yet
 */
export function dueReminder(
  chaseStartedAt: Date,
  sentCount: number,
  now: Date = new Date(),
  cadence: Cadence = DEFAULT_CADENCE,
): DueReminder | null {
  const nextIndex = sentCount;
  const offsetDays = offsetForIndex(nextIndex, cadence);
  const elapsed = daysBetween(chaseStartedAt, now);
  if (elapsed >= offsetDays) {
    return { index: nextIndex, level: levelForIndex(nextIndex), offsetDays };
  }
  return null;
}

/** Human label for a reminder level (internal / logs). */
export function levelLabel(level: ReminderLevel): string {
  return {
    1: "friendly",
    2: "specific-deadline",
    3: "consequence",
    4: "weekly",
  }[level];
}
