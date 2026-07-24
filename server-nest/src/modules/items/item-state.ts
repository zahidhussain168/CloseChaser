/**
 * Item state machine, matching the states already in the database.
 *
 * The deployed schema uses requested -> nudged -> answered -> accepted, where
 * `accepted` is what the product calls "ruled off". We keep those names rather
 * than renaming columns under a live app, and expose ruledOff as a derived
 * boolean so the API reads the way the product speaks.
 */
export const ITEM_STATES = ["requested", "nudged", "answered", "accepted"] as const;
export type ItemState = (typeof ITEM_STATES)[number];

const TRANSITIONS: Record<ItemState, ItemState[]> = {
  requested: ["nudged", "answered"],
  nudged: ["answered", "requested"],
  answered: ["accepted", "requested"], // bookkeeper accepts, or sends it back
  accepted: [], // terminal
};

export function canTransition(from: ItemState, to: ItemState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Still blocking the close: the client owes us something. */
export function isOpen(state: ItemState): boolean {
  return state === "requested" || state === "nudged";
}

/** Ruled off, in product language. */
export function isRuledOff(state: ItemState): boolean {
  return state === "accepted";
}

/**
 * Overdue is derived, never stored, so it can never go stale. An item is
 * overdue when it is still open and older than the grace period.
 */
export const OVERDUE_AFTER_DAYS = 7;

export function isOverdue(
  state: ItemState,
  createdAt: Date,
  now: Date = new Date(),
): boolean {
  if (!isOpen(state)) return false;
  const days = (now.getTime() - createdAt.getTime()) / 86_400_000;
  return days >= OVERDUE_AFTER_DAYS;
}

export function daysOpen(createdAt: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 86_400_000));
}
