"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/auth";
import { ensureCurrentPeriod } from "@/lib/data";
import { getQboConnection } from "@/lib/qbo/connection";
import { syncItemToQbo } from "@/lib/qbo/writeback";
import type { FormState } from "@/lib/forms";
import type { Item } from "@/lib/types";

const editSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  notes: z.string().trim().max(2000).optional(),
});

/** Edit a client's name, email, phone, and private firm notes. */
export async function updateClientAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUserId();
  const parsed = editSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { clientId, name, email, phone, notes } = parsed.data;

  const supabase = createClient();
  const { error } = await supabase
    .from("clients")
    .update({ name, email, phone: phone || null, notes: notes || null })
    .eq("id", clientId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Rule off every item currently answered for this client's close, in one go. */
export async function bulkAcceptAction(clientId: string): Promise<FormState> {
  await requireUserId();
  const supabase = createClient();
  const period = await ensureCurrentPeriod(clientId);
  if (!period) return { ok: false, error: "Could not open the close period." };

  const { data: accepted } = await supabase
    .from("items")
    .update({ state: "accepted", accepted_at: new Date().toISOString() })
    .eq("close_period_id", period.id)
    .eq("state", "answered")
    .select("*");
  const acceptedItems = (accepted as Item[]) ?? [];
  if (acceptedItems.length === 0) return { ok: false, error: "Nothing is answered yet." };

  // Best-effort QuickBooks write-back for accepted QBO items.
  const qboItems = acceptedItems.filter((i) => i.source === "qbo");
  if (qboItems.length) {
    const conn = await getQboConnection();
    if (conn) {
      for (const it of qboItems) {
        try {
          await syncItemToQbo(it, conn);
        } catch {
          /* the failure is recorded on the item and can be retried */
        }
      }
    }
  }

  const { data: all } = await supabase.from("items").select("state").eq("close_period_id", period.id);
  const rows = all ?? [];
  if (rows.length > 0 && rows.every((r) => r.state === "accepted")) {
    await supabase.from("close_periods").update({ status: "closed" }).eq("id", period.id);
  }
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Copy last month's manual requests into this month's close, skipping dupes. */
export async function copyLastMonthAction(clientId: string): Promise<FormState> {
  await requireUserId();
  const supabase = createClient();
  const period = await ensureCurrentPeriod(clientId);
  if (!period) return { ok: false, error: "Could not open the close period." };

  const { data: prior } = await supabase
    .from("close_periods")
    .select("id, month")
    .eq("client_id", clientId)
    .lt("month", period.month)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!prior) return { ok: false, error: "No earlier month to copy from yet." };

  // Manual requests only. QBO transactions are month-specific and pulled fresh.
  const { data: priorItems } = await supabase
    .from("items")
    .select("type, title, details")
    .eq("close_period_id", prior.id)
    .eq("source", "manual");
  const src = priorItems ?? [];
  if (!src.length) return { ok: false, error: "Last month had no manual requests to copy." };

  const { data: existing } = await supabase.from("items").select("title").eq("close_period_id", period.id);
  const have = new Set((existing ?? []).map((r) => r.title));

  const rows = src
    .filter((s) => !have.has(s.title))
    .map((s) => ({
      close_period_id: period.id,
      type: s.type as Item["type"],
      source: "manual" as const,
      title: s.title,
      details: s.details ?? {},
      state: "requested" as const,
    }));
  if (!rows.length) return { ok: false, error: "Everything from last month is already here." };

  const { error } = await supabase.from("items").insert(rows);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
