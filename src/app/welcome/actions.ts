"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFirm } from "@/lib/data";
import { requireUserId } from "@/lib/auth";

/**
 * Save the one-time onboarding answers (or a skip) on the firm and head to the
 * dashboard. onboarded_at is always set so the welcome screen never shows again.
 */
export async function saveOnboardingAction(formData: FormData): Promise<void> {
  await requireUserId();
  const firm = await getFirm();
  if (!firm) redirect("/login");

  const skip = formData.get("skip") != null;
  const val = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null;
  };

  const supabase = createClient();
  await supabase
    .from("firms")
    .update({
      accounting_software: skip ? null : val("accounting_software"),
      client_count: skip ? null : val("client_count"),
      chase_method: skip ? null : val("chase_method"),
      referral_source: skip ? null : val("referral_source"),
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", firm.id);

  redirect("/dashboard");
}
