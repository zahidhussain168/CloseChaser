"use server";

import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { getFirm } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import {
  createPortalSession,
  ensurePaddleCustomer,
  isBillingConfigured,
} from "@/lib/paddle/server";
import type { FormState } from "@/lib/forms";

/**
 * Ensure the firm has a Paddle customer id and return it, so the client-side
 * checkout can attach the purchase to the right customer.
 */
export async function prepareCheckoutAction(): Promise<
  { ok: true; customerId: string; firmId: string; email: string } | FormState
> {
  await requireUserId();
  if (!isBillingConfigured()) return { ok: false, error: "Billing is not set up yet." };

  const firm = await getFirm();
  if (!firm) return { ok: false, error: "No firm found." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? firm.reply_to ?? "";

  let customerId = firm.paddle_customer_id ?? null;
  if (!customerId) {
    try {
      customerId = await ensurePaddleCustomer(email, firm.name);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Could not reach Paddle." };
    }
    await supabase.from("firms").update({ paddle_customer_id: customerId }).eq("id", firm.id);
  }

  return { ok: true, customerId, firmId: firm.id, email };
}

/** Open the Paddle-hosted customer portal to manage or cancel the subscription. */
export async function openBillingPortalAction(): Promise<void> {
  await requireUserId();
  const firm = await getFirm();
  if (!firm?.paddle_customer_id) redirect("/settings/plan?billing=none");

  const url = await createPortalSession(
    firm.paddle_customer_id,
    firm.paddle_subscription_id ? [firm.paddle_subscription_id] : [],
  );
  redirect(url ?? "/settings/plan?billing=portal_error");
}
