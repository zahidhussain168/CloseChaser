import type { ReminderLevel } from "./types";

/**
 * Chase cadence: day 2, day 5, day 9, then weekly, escalating by copy, not by
 * channel. The scheduler sends at most one reminder per run: the next one due.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

export type Cadence = { offsets: number[]; weeklyStep: number };

export const DEFAULT_CADENCE: Cadence = { offsets: [2, 5, 9], weeklyStep: 7 };

export function normaliseCadence(input?: Partial<Cadence> | null): Cadence {
  const offsets = (input?.offsets ?? [])
    .filter((n) => Number.isFinite(n) && n >= 1)
    .map((n) => Math.round(n))
    .sort((a, b) => a - b);
  const step = input?.weeklyStep;
  return {
    offsets: offsets.length ? Array.from(new Set(offsets)) : DEFAULT_CADENCE.offsets,
    weeklyStep: typeof step === "number" && step >= 3 && step <= 30 ? Math.round(step) : DEFAULT_CADENCE.weeklyStep,
  };
}

export function offsetForIndex(index: number, cadence: Cadence = DEFAULT_CADENCE): number {
  const { offsets, weeklyStep } = normaliseCadence(cadence);
  if (index < offsets.length) return offsets[index]!;
  const stepsAfter = index - (offsets.length - 1);
  return offsets[offsets.length - 1]! + stepsAfter * weeklyStep;
}

export function levelForIndex(index: number): ReminderLevel {
  if (index === 0) return 1;
  if (index === 1) return 2;
  if (index === 2) return 3;
  return 4;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

export type DueReminder = { index: number; level: ReminderLevel; offsetDays: number };

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

export function levelLabel(level: ReminderLevel): string {
  return { 1: "friendly", 2: "specific-deadline", 3: "consequence", 4: "weekly" }[level];
}

export const kindForLevel = (level: ReminderLevel): "level1" | "level2" | "level3" | "level4" =>
  (`level${level}`) as "level1" | "level2" | "level3" | "level4";
