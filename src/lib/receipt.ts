import { createClient } from "@/lib/supabase/server";
import { getFirm } from "@/lib/data";
import type { ClosePeriod, Item, Firm } from "@/lib/types";

/**
 * Close Receipt: a timestamped audit artifact for one client's close. Every item
 * that was requested, when it was chased, and when it was answered and accepted.
 * Proof-of-close for the bookkeeper's liability and a tangible deliverable for
 * the client. Rendered on a print-optimized page (Save as PDF) and, in future,
 * shareable via a public token.
 */

export type ReceiptItem = {
  title: string;
  type: string;
  requestedAt: string;
  answeredAt: string | null;
  acceptedAt: string | null;
  state: string;
};

export type CloseReceipt = {
  firmName: string;
  clientName: string;
  clientEmail: string | null;
  month: string; // 'YYYY-MM-01'
  status: string;
  items: ReceiptItem[];
  totalRequested: number;
  totalAccepted: number;
  firstChaseAt: string | null;
  generatedAt: string; // ISO, stamped by caller
};

export async function getCloseReceipt(clientId: string, periodId?: string): Promise<CloseReceipt | null> {
  const supabase = createClient();
  const firm = (await getFirm()) as Firm | null;

  const { data: clientRow } = await supabase.from("clients").select("id, name, email").eq("id", clientId).maybeSingle();
  const client = clientRow as unknown as { id: string; name: string; email: string | null } | null;
  if (!client) return null;

  // Target period: the requested one, else the most recent for this client.
  type P = Pick<ClosePeriod, "id" | "month" | "status">;
  let period: P | null = null;
  if (periodId) {
    const { data } = await supabase.from("close_periods").select("id, month, status").eq("id", periodId).maybeSingle();
    period = (data as unknown as P | null) ?? null;
  } else {
    const { data } = await supabase
      .from("close_periods")
      .select("id, month, status")
      .eq("client_id", clientId)
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle();
    period = (data as unknown as P | null) ?? null;
  }
  if (!period) return null;

  const { data: itemRows } = await supabase
    .from("items")
    .select("title, type, state, created_at, answered_at, accepted_at")
    .eq("close_period_id", period.id)
    .order("created_at", { ascending: true });
  const items = (itemRows as Pick<Item, "title" | "type" | "state" | "created_at" | "answered_at" | "accepted_at">[] | null) ?? [];

  const { data: remRows } = await supabase
    .from("reminders")
    .select("sent_at")
    .eq("close_period_id", period.id)
    .not("sent_at", "is", null)
    .order("sent_at", { ascending: true });
  const reminders = (remRows as { sent_at: string }[] | null) ?? [];
  const firstChaseAt = reminders[0]?.sent_at ?? null;

  const receiptItems: ReceiptItem[] = items.map((it) => ({
    title: it.title,
    type: it.type,
    requestedAt: it.created_at,
    answeredAt: it.answered_at,
    acceptedAt: it.accepted_at,
    state: it.state,
  }));


  return {
    firmName: firm?.name ?? "Your firm",
    clientName: client.name,
    clientEmail: client.email ?? null,
    month: period.month,
    status: period.status,
    items: receiptItems,
    totalRequested: items.length,
    totalAccepted: items.filter((i) => i.state === "accepted").length,
    firstChaseAt,
    generatedAt: "", // stamped by the page (Date is unavailable in some contexts)
  };
}
