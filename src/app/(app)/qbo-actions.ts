"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureCurrentPeriod, getFirm } from "@/lib/data";
import { requireUserId } from "@/lib/auth";
import { parseTransactionCsv } from "@/lib/csv";
import { getQboConnection } from "@/lib/qbo/connection";
import { findBlockingTransactions, titleForTxn } from "@/lib/qbo/sync";
import { revokeToken } from "@/lib/qbo/oauth";
import { decryptSecret } from "@/lib/crypto";
import type { FormState } from "@/lib/forms";
import { isApiEnabled } from "@/lib/api/config";
import { getServerToken } from "@/lib/api/server";
import { qboApi } from "@/lib/api/resources";

type ImportResult = FormState & { added?: number; skipped?: number };

/**
 * Pull this month's uncategorized and "Ask My Accountant" transactions from
 * QuickBooks into the client's checklist. Re-running is safe: anything already
 * imported is skipped on its QBO transaction id.
 */
export async function importFromQboAction(clientId: string): Promise<ImportResult> {
  await requireUserId();

  if (isApiEnabled()) {
    try {
      const result = await qboApi.import(await getServerToken(), clientId);
      revalidatePath(`/clients/${clientId}`);
      revalidatePath("/dashboard");
      return { ok: true, added: result.added, skipped: 0 };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "QuickBooks sync failed." };
    }
  }

  const conn = await getQboConnection();
  if (!conn) return { ok: false, error: "QuickBooks is not connected yet." };

  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, qbo_realm_id")
    .eq("id", clientId)
    .maybeSingle();
  if (!client) return { ok: false, error: "Client not found." };

  const period = await ensureCurrentPeriod(clientId);
  if (!period) return { ok: false, error: "Could not open the close period." };

  let txns;
  try {
    txns = await findBlockingTransactions(conn, period.month);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "QuickBooks sync failed." };
  }

  const { data: existing } = await supabase
    .from("items")
    .select("qbo_txn_id")
    .eq("close_period_id", period.id)
    .not("qbo_txn_id", "is", null);
  const seen = new Set((existing ?? []).map((r) => r.qbo_txn_id));

  const rows = txns
    .filter((t) => !seen.has(t.qboTxnId))
    .map((t) => ({
      close_period_id: period.id,
      type: "transaction" as const,
      source: "qbo" as const,
      qbo_txn_id: t.qboTxnId,
      title: titleForTxn(t),
      details: {
        amount: t.amount ?? undefined,
        date: t.date ?? undefined,
        payee: t.payee ?? undefined,
        note: t.memo ?? undefined,
      },
      state: "requested" as const,
    }));

  if (rows.length) {
    const { error } = await supabase.from("items").insert(rows);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  return { ok: true, added: rows.length, skipped: txns.length - rows.length };
}

/**
 * Record that the bookkeeper sent a reminder by hand from their own phone.
 *
 * Logged as channel 'manual_text' so it counts toward the cadence like any
 * other reminder, which stops the emailer from piling on right after.
 */
export async function logManualTextAction(clientId: string): Promise<FormState> {
  await requireUserId();
  const supabase = createClient();

  const period = await ensureCurrentPeriod(clientId);
  if (!period) return { ok: false, error: "Could not open the close period." };

  const { error } = await supabase.from("reminders").insert({
    client_id: clientId,
    close_period_id: period.id,
    level: 4,
    channel: "manual_text",
    scheduled_for: new Date().toISOString(),
    sent_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

/** Disconnect QuickBooks and revoke the grant with Intuit. */
export async function disconnectQboAction(): Promise<FormState> {
  await requireUserId();
  const conn = await getQboConnection();
  if (!conn) return { ok: true };

  try {
    await revokeToken(decryptSecret(conn.refresh_token));
  } catch {
    // Revocation is best effort; the row is removed either way.
  }

  const supabase = createClient();
  const { error } = await supabase.from("qbo_connections").delete().eq("id", conn.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings", "layout");
  return { ok: true };
}

/**
 * CSV fallback, so the product works before Intuit approves API access: the
 * bookkeeper exports transactions from QuickBooks and uploads the file.
 */
export async function importCsvAction(
  _prev: ImportResult,
  formData: FormData,
): Promise<ImportResult> {
  await requireUserId();
  const firm = await getFirm();
  if (!firm) return { ok: false, error: "No firm found." };

  const clientId = String(formData.get("clientId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a CSV file to upload." };
  }
  if (file.size > 2_000_000) {
    return { ok: false, error: "That file is larger than 2 MB. Export a single month." };
  }

  let parsed;
  try {
    parsed = parseTransactionCsv(await file.text());
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not read that CSV." };
  }
  if (!parsed.length) {
    return { ok: false, error: "No rows found. Expected columns like date, description, amount." };
  }

  const period = await ensureCurrentPeriod(clientId);
  if (!period) return { ok: false, error: "Could not open the close period." };

  const supabase = createClient();
  const rows = parsed.map((r) => ({
    close_period_id: period.id,
    type: "transaction" as const,
    source: "manual" as const,
    title: r.payee
      ? `Uncategorized charge${r.amount != null ? ` of ${r.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}` : ""} at ${r.payee}`
      : r.description || "Uncategorized charge",
    details: {
      amount: r.amount ?? undefined,
      date: r.date ?? undefined,
      payee: r.payee ?? undefined,
      note: r.description ?? undefined,
    },
    state: "requested" as const,
  }));

  const { error } = await supabase.from("items").insert(rows);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  return { ok: true, added: rows.length };
}
