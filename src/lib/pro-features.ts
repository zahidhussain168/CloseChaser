import { getSubscriptionState } from "@/lib/paddle/subscription";
import type { Firm } from "@/lib/types";

/**
 * Client-safe entitlement primitives. Kept separate from entitlements.ts (which
 * pulls server-only data) so client components can import these without dragging
 * in server code.
 *
 * Three flat levels, never per-client:
 *   Free   (post-trial, unsubscribed) - the basic collection loop still works.
 *   Pro    ($39) - the full close-and-chase product.
 *   Scale  ($69) - Pro plus the intelligence + automation (Forecast, AI analyst,
 *                  SMS escalation, responsiveness scoring, Close Receipts).
 * The 14-day trial gets full Scale access so a firm feels everything.
 */

export type PlanTier = "none" | "pro" | "scale";

export const PRO_FEATURES = {
  // Scale tier
  forecast: {
    tier: "scale",
    title: "Close Forecast",
    blurb: "Predict each client's finish date and see who will make you late, before it happens.",
  },
  aiAnalyst: {
    tier: "scale",
    title: "AI Close Analyst",
    blurb: "One read of every client, with the single best next move and a one-click action.",
  },
  responsiveness: {
    tier: "scale",
    title: "Responsiveness Score",
    blurb: "Grade every client on how they respond, and see your whole book ranked.",
  },
  closeReceipt: {
    tier: "scale",
    title: "Close Receipts",
    blurb: "A timestamped proof-of-close per client, exportable as a PDF.",
  },
  // Pro tier (full product)
  bulkChase: {
    tier: "pro",
    title: "Chase Everyone",
    blurb: "Send the whole book their branded links in one click, then let reminders run.",
  },
  autoChase: {
    tier: "pro",
    title: "Auto-chase",
    blurb: "New month, new close, chased automatically from your template. Hands off.",
  },
  emailPreview: {
    tier: "pro",
    title: "Live email preview",
    blurb: "See the branded email update as you edit, exactly as your client will receive it.",
  },
} as const;

export type ProFeatureKey = keyof typeof PRO_FEATURES;

/** The firm's current access level. Trial counts as full Scale. */
export function firmPlanTier(firm: Firm | null): PlanTier {
  if (!firm) return "none";
  const state = getSubscriptionState(firm);
  if (!state.active) return "none";
  if (state.inTrial) return "scale"; // trial gets the full product
  return firm.plan === "scale" ? "scale" : "pro";
}

/** True when the firm has any active paid access or is in trial. */
export function firmIsPro(firm: Firm | null): boolean {
  return firmPlanTier(firm) !== "none";
}

/** True when the firm has Scale-tier access (paid Scale or trial). */
export function firmIsScale(firm: Firm | null): boolean {
  return firmPlanTier(firm) === "scale";
}

