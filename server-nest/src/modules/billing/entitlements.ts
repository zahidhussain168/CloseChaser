/**
 * Entitlements.
 *
 * Three flat levels, never per-client, matching what the app already sells:
 *   free   the basic collection loop still works after the trial ends
 *   pro    the full close-and-chase product
 *   scale  pro plus the intelligence and automation
 *
 * The 14-day trial gets full Scale access so a firm feels everything before
 * deciding. This is pure so it can be unit tested and so the same answer is
 * reachable from anywhere without a database round trip.
 */
export type PlanTier = "free" | "pro" | "scale";

/** The statuses Paddle can report, plus our pre-billing default. */
export type SubscriptionStatus =
  | "trialing" | "active" | "past_due" | "paused" | "canceled" | "expired";

export const FEATURES = {
  // Scale
  forecast: "scale",
  aiAnalyst: "scale",
  responsiveness: "scale",
  closeReceipt: "scale",
  smsEscalation: "scale",
  // Pro
  bulkChase: "pro",
  autoChase: "pro",
  emailPreview: "pro",
  autoEscalatingReminders: "pro",
} as const satisfies Record<string, Exclude<PlanTier, "free">>;

export type FeatureKey = keyof typeof FEATURES;

const RANK: Record<PlanTier, number> = { free: 0, pro: 1, scale: 2 };

/**
 * What a firm can actually use right now.
 *
 * past_due deliberately keeps access: the card failed, the customer has not
 * left, and locking someone out mid-close over a retryable payment is how you
 * turn a billing hiccup into a cancellation. paused and canceled drop to free,
 * which still collects documents so nobody's clients are stranded mid-month.
 */
export function effectiveTier(
  plan: string | null | undefined,
  status: string | null | undefined,
  trialEndsAt: Date | null | undefined,
  now: Date = new Date(),
): PlanTier {
  if (status === "trialing") {
    // A trial that has run out is no longer a trial, whatever the row says.
    if (!trialEndsAt || trialEndsAt.getTime() > now.getTime()) return "scale";
    return "free";
  }
  if (status === "active" || status === "past_due") {
    return plan === "scale" ? "scale" : "pro";
  }
  return "free";
}

export function can(tier: PlanTier, feature: FeatureKey): boolean {
  return RANK[tier] >= RANK[FEATURES[feature]];
}

/** Every feature flag at once, which is what a client actually wants. */
export function entitlementsFor(tier: PlanTier): Record<FeatureKey, boolean> {
  const out = {} as Record<FeatureKey, boolean>;
  for (const key of Object.keys(FEATURES) as FeatureKey[]) out[key] = can(tier, key);
  return out;
}

/** Paddle's status vocabulary, narrowed to ours. Anything unknown is expired. */
export function normaliseStatus(paddle: string | null | undefined): SubscriptionStatus {
  const allowed: SubscriptionStatus[] = [
    "trialing", "active", "past_due", "paused", "canceled", "expired",
  ];
  return allowed.includes(paddle as SubscriptionStatus)
    ? (paddle as SubscriptionStatus)
    : "expired";
}
