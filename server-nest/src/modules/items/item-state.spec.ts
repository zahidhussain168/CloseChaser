import { describe, expect, it } from "vitest";
import { canTransition, daysOpen, isOpen, isOverdue, isRuledOff, OVERDUE_AFTER_DAYS } from "./item-state";

const days = (n: number) => new Date(Date.now() - n * 86_400_000);

describe("item state machine", () => {
  it("walks the happy path requested -> answered -> accepted", () => {
    expect(canTransition("requested", "answered")).toBe(true);
    expect(canTransition("answered", "accepted")).toBe(true);
  });

  it("lets a chase nudge, and a nudged item still be answered", () => {
    expect(canTransition("requested", "nudged")).toBe(true);
    expect(canTransition("nudged", "answered")).toBe(true);
  });

  it("lets the bookkeeper send an answer back for more", () => {
    expect(canTransition("answered", "requested")).toBe(true);
  });

  it("treats accepted as terminal", () => {
    for (const to of ["requested", "nudged", "answered", "accepted"] as const) {
      expect(canTransition("accepted", to)).toBe(false);
    }
  });

  it("refuses to skip the client: requested cannot jump to accepted", () => {
    expect(canTransition("requested", "accepted")).toBe(false);
    expect(canTransition("nudged", "accepted")).toBe(false);
  });

  it("knows what is still blocking the close", () => {
    expect(isOpen("requested")).toBe(true);
    expect(isOpen("nudged")).toBe(true);
    expect(isOpen("answered")).toBe(false); // waiting on the bookkeeper, not the client
    expect(isOpen("accepted")).toBe(false);
  });

  it("maps accepted to ruled off", () => {
    expect(isRuledOff("accepted")).toBe(true);
    expect(isRuledOff("answered")).toBe(false);
  });
});

describe("overdue derivation", () => {
  it("is not overdue before the grace period", () => {
    expect(isOverdue("requested", days(OVERDUE_AFTER_DAYS - 1))).toBe(false);
  });

  it("is overdue once the grace period passes", () => {
    expect(isOverdue("requested", days(OVERDUE_AFTER_DAYS))).toBe(true);
    expect(isOverdue("nudged", days(OVERDUE_AFTER_DAYS + 30))).toBe(true);
  });

  it("is never overdue once the client has done their part", () => {
    // The whole point: an old answered item is waiting on US, not the client.
    expect(isOverdue("answered", days(90))).toBe(false);
    expect(isOverdue("accepted", days(90))).toBe(false);
  });

  it("counts days open without going negative on clock skew", () => {
    expect(daysOpen(days(3))).toBe(3);
    expect(daysOpen(new Date(Date.now() + 60_000))).toBe(0);
  });
});
