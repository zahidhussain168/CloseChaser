import Link from "next/link";
import { getSubscriptionState } from "@/lib/paddle/subscription";
import type { Firm } from "@/lib/types";

/**
 * Slim banner across the app when the firm is on a trial or lapsed. Paid firms
 * see nothing. Kept gentle: it informs and links to billing rather than blocking
 * work, so an expired trial never traps someone mid-close.
 */
export function TrialBanner({ firm }: { firm: Firm }) {
  const sub = getSubscriptionState(firm);

  // Paid and healthy: no banner.
  if (sub.status === "active" || sub.status === "past_due") return null;
  if (sub.hasSubscription && sub.status !== "canceled" && sub.status !== "expired") {
    return null;
  }

  const expired = !sub.inTrial;
  const tone = expired ? "bg-danger" : sub.trialDaysLeft <= 3 ? "bg-warning" : "bg-brand";
  const message = expired
    ? "Your free trial has ended. Forecast, AI, and auto-chase are locked. Basic collection still works."
    : `${sub.trialDaysLeft} day${sub.trialDaysLeft === 1 ? "" : "s"} left in your free trial. Enjoy every Pro feature until then.`;

  return (
    <div className={`${tone} text-white`}>
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-5 py-2 text-[13.5px]">
        <span className="font-medium">{message}</span>
        <Link
          href="/settings"
          className="rounded-md bg-white/20 px-2.5 py-1 font-semibold transition-colors hover:bg-white/30"
        >
          {expired ? "Subscribe to continue" : "Subscribe now"}
        </Link>
      </div>
    </div>
  );
}
