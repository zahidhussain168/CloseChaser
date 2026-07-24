import { describe, expect, it } from "vitest";
import {
  DEFAULT_CADENCE,
  dueReminder,
  levelForIndex,
  normaliseCadence,
  offsetForIndex,
} from "./cadence";

const start = new Date("2026-07-01T09:00:00Z");
const plus = (days: number) => new Date(start.getTime() + days * 86_400_000);

describe("cadence", () => {
  it("walks day 2, day 5, day 9, then weekly", () => {
    expect(offsetForIndex(0)).toBe(2);
    expect(offsetForIndex(1)).toBe(5);
    expect(offsetForIndex(2)).toBe(9);
    expect(offsetForIndex(3)).toBe(16);
    expect(offsetForIndex(4)).toBe(23);
  });

  it("escalates the copy, capping at the weekly nudge", () => {
    expect(levelForIndex(0)).toBe(1);
    expect(levelForIndex(1)).toBe(2);
    expect(levelForIndex(2)).toBe(3);
    expect(levelForIndex(9)).toBe(4);
  });

  it("falls back to the default for a nonsensical cadence", () => {
    expect(normaliseCadence({ offsets: [], weeklyStep: 0 })).toEqual(DEFAULT_CADENCE);
    expect(normaliseCadence(null)).toEqual(DEFAULT_CADENCE);
    expect(normaliseCadence({ offsets: [-3, 0] }).offsets).toEqual(DEFAULT_CADENCE.offsets);
  });

  it("sorts and dedupes a custom cadence", () => {
    expect(normaliseCadence({ offsets: [9, 2, 2, 5] }).offsets).toEqual([2, 5, 9]);
  });

  it("respects a firm's custom cadence", () => {
    const c = { offsets: [1, 3], weeklyStep: 14 };
    expect(offsetForIndex(0, c)).toBe(1);
    expect(offsetForIndex(2, c)).toBe(17);
  });
});

describe("dueReminder", () => {
  it("sends nothing before the first milestone", () => {
    expect(dueReminder(start, 0, plus(1))).toBeNull();
  });

  it("sends the friendly one on day 2", () => {
    expect(dueReminder(start, 0, plus(2))).toMatchObject({ index: 0, level: 1 });
  });

  it("does not re-send a milestone already counted", () => {
    // One already sent, and it is only day 2: the next is not due until day 5.
    expect(dueReminder(start, 1, plus(2))).toBeNull();
    expect(dueReminder(start, 1, plus(5))).toMatchObject({ index: 1, level: 2 });
  });

  it("sends only ONE reminder even when several milestones were missed", () => {
    // Cron was down for two weeks. We owe day 2, 5 and 9, but a client should
    // get one email, not a pile of them.
    const due = dueReminder(start, 0, plus(30));
    expect(due).toMatchObject({ index: 0, level: 1 });
  });

  it("keeps nudging weekly once the milestones run out", () => {
    expect(dueReminder(start, 3, plus(16))).toMatchObject({ index: 3, level: 4 });
    expect(dueReminder(start, 3, plus(15))).toBeNull();
  });
});
