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
};

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
  };

  let query = admin.from("firms").update(update);
  query = firmId
    ? query.eq("id", firmId)
    : query.eq("paddle_customer_id", sub.customer_id);

  const { error } = await query;
  if (error) {
    // Return 500 so Paddle retries rather than dropping the event.
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, type });
}
