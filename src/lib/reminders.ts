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

/** Fixed early milestones; after these, cadence becomes weekly. */
const EARLY_OFFSETS = [2, 5, 9] as const;
const WEEKLY_STEP = 7;

/** Day-offset from chase start for the Nth reminder (0-indexed). */
export function offsetForIndex(index: number): number {
  if (index < EARLY_OFFSETS.length) return EARLY_OFFSETS[index];
  // index 3 → 9 + 7 = 16, index 4 → 23, ...
  const weeksAfter = index - (EARLY_OFFSETS.length - 1);
  return EARLY_OFFSETS[EARLY_OFFSETS.length - 1] + weeksAfter * WEEKLY_STEP;
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
): DueReminder | null {
  const nextIndex = sentCount;
  const offsetDays = offsetForIndex(nextIndex);
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
