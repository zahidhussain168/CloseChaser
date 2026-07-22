import type { Item, ItemState } from "./types";

/** Item state machine: requested -> nudged -> answered -> accepted. */
const TRANSITIONS: Record<ItemState, ItemState[]> = {
  requested: ["nudged", "answered"],
  nudged: ["answered", "requested"],
  answered: ["accepted", "requested"],
  accepted: [],
};

export function canTransition(from: ItemState, to: ItemState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Still blocking the close; the client owes us something. */
export function isOpen(state: ItemState): boolean {
  return state === "requested" || state === "nudged";
}

export function isClientComplete(state: ItemState): boolean {
  return state === "answered" || state === "accepted";
}

export function openCount(items: Pick<Item, "state">[]): number {
  return items.filter((i) => isOpen(i.state)).length;
}

export function isPeriodComplete(items: Pick<Item, "state">[]): boolean {
  return items.length > 0 && items.every((i) => !isOpen(i.state));
}
