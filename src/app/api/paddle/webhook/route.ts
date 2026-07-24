import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaddleSignature } from "@/lib/paddle/server";

export const dynamic = "force-dynamic";

/**
 * Paddle Billing webhook.
 *
 * Public by design: Paddle authenticates itself with the signature, not a
 * session. The signature MUST be checked against the raw body, so this reads
 * request.text() before any parsing.
 */

type PaddleSubscription = {
  id: string;
  status: string;
  customer_id: string;
  current_billing_period?: { ends_at?: string } | null;
  custom_data?: { firm_id?: string } | null;
  items?: { price?: { id?: string } | null }[] | null;
};

/** Map the purchased Paddle price to our flat tier. Defaults to 'pro'. */
function planFromItems(items: PaddleSubscription["items"]): "pro" | "scale" {
  const scalePriceId = process.env.NEXT_PUBLIC_PADDLE_SCALE_PRICE_ID;
  const priceIds = (items ?? []).map((i) => i.price?.id).filter(Boolean) as string[];
  return scalePriceId && priceIds.includes(scalePriceId) ? "scale" : "pro";
}

function statusToLocal(paddle: string): string {
  // Paddle: trialing, active, past_due, paused, canceled
  const allowed = ["trialing", "active", "past_due", "paused", "canceled"];
  return allowed.includes(paddle) ? paddle : "expired";
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("paddle-signature");

  if (!verifyPaddleSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event_type?: string; data?: PaddleSubscription };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const type = event.event_type ?? "";
  const sub = event.data;

  // Only subscription lifecycle events change access.
  if (!type.startsWith("subscription.") || !sub) {
    return NextResponse.json({ ok: true, ignored: type });
  }

  const admin = createAdminClient();

  // Resolve the firm: prefer custom_data.firm_id sent at checkout, else the
  // Paddle customer id we stored when the subscription was created.
  const firmId = sub.custom_data?.firm_id ?? null;
  const update = {
    subscription_status: statusToLocal(sub.status),
    paddle_subscription_id: sub.id,
    paddle_customer_id: sub.customer_id,
    current_period_end: sub.current_billing_period?.ends_at ?? null,
    plan: planFromItems(sub.items),
  };

  let query = admin.from("firms").update(update);
  query = firmId
    ? query.eq("id", firmId)
    : query.eq("paddle_customer_id", sub.customer_id);

  const { data: updated, error } = await query.select("id");
  if (error) {
    // Return 500 so Paddle retries rather than dropping the event.
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    // A real subscription event that matches no firm means a paying customer was
    // not provisioned. Never 200 that away (it would be lost silently): log it
    // and 500 so Paddle keeps retrying while we reconcile.
    console.error("[paddle-webhook] no firm matched for subscription event", {
      type,
      subscriptionId: sub.id,
      customerId: sub.customer_id,
      firmId,
    });
    return NextResponse.json({ error: "No matching firm" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, type });
}
