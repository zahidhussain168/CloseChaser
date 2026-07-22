"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFirm } from "@/lib/data";
import { requireUserId } from "@/lib/auth";
import { INTEGRATION_KEYS } from "@/lib/integrations";
import type { FormState } from "@/lib/forms";

/**
 * Register a firm's interest in a "coming soon" integration. Idempotent (unique
 * on firm+key), so tapping "Notify me" twice is harmless. Feeds the roadmap and
 * lets us email them when it ships.
 */
export async function requestIntegrationAction(key: string): Promise<FormState> {
  await requireUserId();
  if (!INTEGRATION_KEYS.has(key)) {
    return { ok: false, error: "Unknown integration" };
  }
  const firm = await getFirm();
  if (!firm) return { ok: false, error: "No firm found" };

  const supabase = createClient();
  const { error } = await supabase
    .from("integration_requests")
    .upsert(
      { firm_id: firm.id, integration_key: key },
      { onConflict: "firm_id,integration_key", ignoreDuplicates: true },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/integrations");
  return { ok: true };
}

/** Keys of integrations this firm has already asked to be notified about. */
export async function listRequestedIntegrations(): Promise<string[]> {
  const firm = await getFirm();
  if (!firm) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("integration_requests")
    .select("integration_key")
    .eq("firm_id", firm.id);
  return (data ?? []).map((r) => r.integration_key as string);
}
