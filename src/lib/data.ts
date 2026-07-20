import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type {
  Client,
  Firm,
  Item,
  ClosePeriod,
  RequestTemplate,
  TemplateItem,
} from "@/lib/types";
import { monthKey } from "@/lib/format";
import { openCount } from "@/lib/state";

type DB = SupabaseClient<Database>;

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
  lastOpenedAt: string | null;
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

    const { data: linkRow } = await supabase
      .from("magic_links")
      .select("last_opened_at, expires_at")
      .eq("client_id", c.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastOpenedAt =
      linkRow && new Date(linkRow.expires_at).getTime() > Date.now()
        ? linkRow.last_opened_at
        : null;

    result.push({
      ...c,
      period: (period as ClosePeriod) ?? null,
      openCount: openCount(items),
      totalItems: items.length,
      lastOpenedAt,
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
  const period = (created as unknown as ClosePeriod | null) ?? null;

  // A brand-new month's period auto-seeds from the client's default template.
  if (period) {
    const { data: client } = await supabase
      .from("clients")
      .select("default_template_id")
      .eq("id", clientId)
      .maybeSingle();
    const templateId = (client as { default_template_id: string | null } | null)
      ?.default_template_id;
    if (templateId) await seedPeriodFromTemplate(supabase, templateId, period.id);
  }
  return period;
}

export type TemplateWithItems = RequestTemplate & { items: TemplateItem[] };

/** All request templates for the firm, with their items. */
export async function listTemplates(): Promise<TemplateWithItems[]> {
  const supabase = createClient();
  const firm = await getFirm();
  if (!firm) return [];
  const { data: templates } = await supabase
    .from("request_templates")
    .select("*")
    .eq("firm_id", firm.id)
    .order("created_at", { ascending: true });

  const result: TemplateWithItems[] = [];
  for (const t of (templates as RequestTemplate[]) ?? []) {
    const { data: items } = await supabase
      .from("template_items")
      .select("*")
      .eq("template_id", t.id)
      .order("position", { ascending: true });
    result.push({ ...t, items: (items as TemplateItem[]) ?? [] });
  }
  return result;
}

/** Insert a template's items into a close period as manual requests. */
export async function seedPeriodFromTemplate(
  supabase: DB,
  templateId: string,
  periodId: string,
): Promise<number> {
  const { data: tItems } = await supabase
    .from("template_items")
    .select("*")
    .eq("template_id", templateId)
    .order("position", { ascending: true });
  const items = (tItems as TemplateItem[]) ?? [];
  if (items.length === 0) return 0;

  const rows = items.map((t) => ({
    close_period_id: periodId,
    type: t.type,
    source: "manual" as const,
    title: t.title,
    details: t.note ? { note: t.note } : {},
    state: "requested" as const,
  }));
  const { error } = await supabase.from("items").insert(rows);
  return error ? 0 : rows.length;
}
