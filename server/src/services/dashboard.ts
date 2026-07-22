import type { SupabaseClient } from "@supabase/supabase-js";
import { openCount, isOpen } from "../domain/state";
import { currentMonthISO } from "./periods";
import type { Client, ClosePeriod, Item } from "../domain/types";

export type ClientWithBlocking = Client & {
  openCount: number;
  period: ClosePeriod | null;
  totalItems: number;
  lastOpenedAt: string | null;
};

export type CloseRollup = {
  documentsOpen: number;
  transactionsOpen: number;
  neverOpened: string[];
  notChased: string[];
  oldest: { client: string; title: string; days: number } | null;
};

/** Clients annotated with how much is blocking the close, sorted most-blocking
 *  first. Mirrors the app's listClientsWithBlocking. */
async function listClientsWithBlocking(db: SupabaseClient): Promise<ClientWithBlocking[]> {
  const { data: clients } = await db.from("clients").select("*").order("created_at", { ascending: true });
  if (!clients || clients.length === 0) return [];

  const month = currentMonthISO();
  const result: ClientWithBlocking[] = [];

  for (const c of clients as Client[]) {
    const { data: period } = await db.from("close_periods").select("*").eq("client_id", c.id).eq("month", month).maybeSingle();

    let items: Pick<Item, "state">[] = [];
    if (period) {
      const { data: itemRows } = await db.from("items").select("state").eq("close_period_id", (period as ClosePeriod).id);
      items = (itemRows as Pick<Item, "state">[]) ?? [];
    }

    const { data: linkRow } = await db
      .from("magic_links")
      .select("last_opened_at, expires_at")
      .eq("client_id", c.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastOpenedAt =
      linkRow && new Date(linkRow.expires_at as string).getTime() > Date.now() ? (linkRow.last_opened_at as string | null) : null;

    result.push({
      ...c,
      period: (period as ClosePeriod) ?? null,
      openCount: openCount(items),
      totalItems: items.length,
      lastOpenedAt,
    });
  }

  result.sort((a, b) => b.openCount - a.openCount || b.totalItems - a.totalItems);
  return result;
}

/** What is blocking the close across every client. Mirrors getCloseRollup. */
async function buildRollup(db: SupabaseClient, clients: ClientWithBlocking[]): Promise<CloseRollup> {
  const blocking = clients.filter((c) => c.openCount > 0);
  const rollup: CloseRollup = {
    documentsOpen: 0,
    transactionsOpen: 0,
    neverOpened: blocking.filter((c) => !c.lastOpenedAt).map((c) => c.name),
    notChased: blocking.filter((c) => c.period?.status !== "chasing").map((c) => c.name),
    oldest: null,
  };

  const periodIds = blocking.map((c) => c.period?.id).filter(Boolean) as string[];
  if (periodIds.length === 0) return rollup;

  const { data } = await db.from("items").select("title, type, state, created_at, close_period_id").in("close_period_id", periodIds);
  const nameByPeriod = new Map(blocking.map((c) => [c.period?.id ?? "", c.name] as const));

  for (const row of (data ?? []) as Pick<Item, "title" | "type" | "state" | "created_at" | "close_period_id">[]) {
    if (!isOpen(row.state)) continue;
    if (row.type === "document") rollup.documentsOpen += 1;
    else rollup.transactionsOpen += 1;
    const days = Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86_400_000);
    if (!rollup.oldest || days > rollup.oldest.days) {
      rollup.oldest = { client: nameByPeriod.get(row.close_period_id) ?? "A client", title: row.title, days };
    }
  }
  return rollup;
}

export async function getDashboard(db: SupabaseClient): Promise<{ clients: ClientWithBlocking[]; rollup: CloseRollup }> {
  const clients = await listClientsWithBlocking(db);
  const rollup = await buildRollup(db, clients);
  return { clients, rollup };
}
