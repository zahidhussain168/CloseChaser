import type { Item, ItemState } from "@/lib/types";

/**
 * Item state machine: requested → nudged → answered → accepted.
 *
 *  requested  initial; nothing sent yet or awaiting client
 *  nudged     a reminder has gone out; still awaiting the client
 *  answered   the client sent something back (text and/or files)
 *  accepted   the bookkeeper accepted it — the item is ruled off (final)
 */
const TRANSITIONS: Record<ItemState, ItemState[]> = {
  requested: ["nudged", "answered"],
  nudged: ["answered", "requested"],
  answered: ["accepted", "requested"], // bookkeeper accepts, or sends back
  accepted: [], // terminal
};

export function canTransition(from: ItemState, to: ItemState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Still blocking the close — the client owes us something. */
export function isOpen(state: ItemState): boolean {
  return state === "requested" || state === "nudged";
}

/** The client has done their part (whether or not the bookkeeper accepted). */
export function isClientComplete(state: ItemState): boolean {
  return state === "answered" || state === "accepted";
}

/** Fully ruled off by the bookkeeper. */
export function isAccepted(state: ItemState): boolean {
  return state === "accepted";
}

export function openItems<T extends { state: ItemState }>(items: T[]): T[] {
  return items.filter((i) => isOpen(i.state));
}

/** A close period is done when no items remain open. */
export function isPeriodComplete(items: Pick<Item, "state">[]): boolean {
  return items.length > 0 && items.every((i) => !isOpen(i.state));
}

export function openCount(items: Pick<Item, "state">[]): number {
  return items.filter((i) => isOpen(i.state)).length;
}
