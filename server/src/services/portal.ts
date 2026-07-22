import { admin } from "../lib/supabase";
import { resolveToken } from "./links";
import { formatMonth, formatDate, formatMoney } from "./format";
import type { Attachment, Item } from "../domain/types";

export const ATTACHMENTS_BUCKET = "attachments";

export type PortalError = { error: "not_found" | "expired" | "revoked" };

/** Load the client-facing checklist for a magic-link token. Admin client,
 *  scoped strictly by the resolved token. */
export async function loadPortal(token: string) {
  const resolved = await resolveToken(admin, token);
  if ("error" in resolved) return resolved as PortalError;

  const { data: client } = await admin.from("clients").select("*").eq("id", resolved.clientId).single();
  if (!client) return { error: "not_found" } as PortalError;

  const { data: firm } = await admin.from("firms").select("id, name, accent_color").eq("id", client.firm_id).single();

  // Current (most recent) period for this client.
  const { data: period } = await admin
    .from("close_periods")
    .select("*")
    .eq("client_id", client.id)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();

  const items = period
    ? ((await admin.from("items").select("*").eq("close_period_id", period.id).order("created_at", { ascending: true })).data ?? [])
    : [];

  return {
    firm,
    client: { id: client.id, name: client.name },
    period,
    monthLabel: period ? formatMonth(period.month) : "",
    items: (items as Item[]).map(mapItem),
  };
}

function mapItem(i: Item) {
  const d = (i.details ?? {}) as { note?: string; amount?: number; date?: string; payee?: string; questions?: string[] };
  let meta: string | null = null;
  if (i.type === "transaction") {
    const parts: string[] = [];
    if (d.date) parts.push(formatDate(d.date));
    if (d.payee) parts.push(d.payee);
    if (typeof d.amount === "number") parts.push(formatMoney(d.amount));
    meta = parts.join(" - ") || null;
  }
  return {
    id: i.id,
    type: i.type,
    title: i.title,
    note: d.note ?? null,
    meta,
    questions: Array.isArray(d.questions) ? d.questions : null,
    state: i.state,
    answer_text: i.answer_text,
    attachments: ((i.attachments ?? []) as Attachment[]).map((a) => ({ name: a.name })),
  };
}

/** Verify an item belongs to the token's client (so the public route can't
 *  touch another client's data). */
export async function itemForToken(token: string, itemId: string): Promise<Item | null> {
  const resolved = await resolveToken(admin, token);
  if ("error" in resolved) return null;
  const { data: item } = await admin.from("items").select("*").eq("id", itemId).maybeSingle();
  if (!item) return null;
  const { data: period } = await admin.from("close_periods").select("client_id").eq("id", item.close_period_id).maybeSingle();
  if (!period || period.client_id !== resolved.clientId) return null;
  return item as Item;
}
