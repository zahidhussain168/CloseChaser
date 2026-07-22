import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClosePeriod } from "../domain/types";

/** First day of the current month as 'YYYY-MM-01' (UTC). */
export function currentMonthISO(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** Find or create the current close period for a client. */
export async function ensureCurrentPeriod(db: SupabaseClient, clientId: string): Promise<ClosePeriod | null> {
  const month = currentMonthISO();
  const { data: existing } = await db
    .from("close_periods")
    .select("*")
    .eq("client_id", clientId)
    .eq("month", month)
    .maybeSingle();
  if (existing) return existing as ClosePeriod;

  const { data, error } = await db
    .from("close_periods")
    .insert({ client_id: clientId, month, status: "open" })
    .select("*")
    .single();
  if (error) return null;
  return data as ClosePeriod;
}
