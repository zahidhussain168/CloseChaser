import type { Firm } from "@/lib/types";

export type SubStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "canceled"
  | "expired";

export type SubscriptionState = {
  status: SubStatus;
  /** True when the app should be usable (paid or still in trial). */
  active: boolean;
  inTrial: boolean;
  trialEndsAt: string | null;
  /** Whole days left in the trial, floored at 0. */
  trialDaysLeft: number;
  currentPeriodEnd: string | null;
  hasSubscription: boolean;
};

type BillingFields = {
  subscription_status?: string | null;
  paddle_subscription_id?: string | null;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
};

/**
 * Derive whether a firm may use the app. A live Paddle subscription (active or
 * trialing) always grants access. Otherwise access lasts until the 14-day trial
 * window ends. past_due keeps access briefly so a failed renewal does not lock
 * someone out mid-close; canceled/expired do not.
 */
export function getSubscriptionState(firm: Firm & BillingFields, now = new Date()): SubscriptionState {
  const status = (firm.subscription_status ?? "trialing") as SubStatus;
  const trialEndsAt = firm.trial_ends_at ?? null;
  const hasSubscription = Boolean(firm.paddle_subscription_id);

  const trialMs = trialEndsAt ? new Date(trialEndsAt).getTime() - now.getTime() : 0;
  const inTrialWindow = trialMs > 0;
  const trialDaysLeft = Math.max(0, Math.ceil(trialMs / 86_400_000));

  let active = false;
  if (status === "active" || status === "trialing" || status === "past_due") {
    active = true;
  } else if (!hasSubscription && inTrialWindow) {
    active = true; // still inside the free trial, no subscription yet
  }

  return {
    status,
    active,
    inTrial: !hasSubscription && inTrialWindow,
    trialEndsAt,
    trialDaysLeft,
    currentPeriodEnd: firm.current_period_end ?? null,
    hasSubscription,
  };
}
