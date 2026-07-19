import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Client, Firm, Item, ClosePeriod } from "@/lib/types";
import { monthKey } from "@/lib/format";
import { openCount } from "@/lib/state";

/** The signed-in bookkeeper's firm (one per user). */
export async function getFirm(): Promise<Firm | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("firms")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  return (data as Firm | null) ?? null;
}

export type ClientWithBlocking = Client & {
  openCount: number;
  period: ClosePeriod | null;
  totalItems: number;
};

/** All clients for the firm, annotated with how much is blocking the close. */
export async function listClientsWithBlocking(): Promise<ClientWithBlocking[]> {
  const supabase = createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: true });

  if (!clients || clients.length === 0) return [];

  const month = monthKey();
  const result: ClientWithBlocking[] = [];

  for (const c of clients as Client[]) {
    const { data: period } = await supabase
      .from("close_periods")
      .select("*")
      .eq("client_id", c.id)
      .eq("month", month)
      .maybeSingle();

    let items: Pick<Item, "state">[] = [];
    if (period) {
      const { data: itemRows } = await supabase
        .from("items")
        .select("state")
        .eq("close_period_id", (period as ClosePeriod).id);
      items = (itemRows as Pick<Item, "state">[]) ?? [];
    }

    result.push({
      ...c,
      period: (period as ClosePeriod) ?? null,
      openCount: openCount(items),
      totalItems: items.length,
    });
  }

  // Sort: most blocking first, then clients with any items, then the rest.
  result.sort((a, b) => b.openCount - a.openCount || b.totalItems - a.totalItems);
  return result;
}

export type ClientDetail = {
  client: Client;
  period: ClosePeriod;
  items: Item[];
  hasLink: boolean;
};

export async function getClientDetail(
  clientId: string,
): Promise<ClientDetail | null> {
  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  if (!client) return null;

  const period = await ensureCurrentPeriod(clientId);
  if (!period) return null;

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("close_period_id", period.id)
    .order("created_at", { ascending: true });

  const { data: link } = await supabase
    .from("magic_links")
    .select("id")
    .eq("client_id", clientId)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();

  return {
    client: client as Client,
    period,
    items: (items as Item[]) ?? [],
    hasLink: !!link,
  };
}

/** Get or create the current calendar month's close period for a client. */
export async function ensureCurrentPeriod(
  clientId: string,
): Promise<ClosePeriod | null> {
  const supabase = createClient();
  const month = monthKey();

  const { data: existing } = await supabase
    .from("close_periods")
    .select("*")
    .eq("client_id", clientId)
    .eq("month", month)
    .maybeSingle();
  if (existing) return existing as unknown as ClosePeriod;

  const { data: created } = await supabase
    .from("close_periods")
    .insert({ client_id: clientId, month, status: "open" })
    .select("*")
    .single();
  return (created as unknown as ClosePeriod | null) ?? null;
}
