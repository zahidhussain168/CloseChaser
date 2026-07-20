"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Check } from "lucide-react";
import { prepareCheckoutAction, openBillingPortalAction } from "@/app/(app)/billing-actions";

type Props = {
  configured: boolean;
  priceId: string | null;
  clientToken: string | null;
  environment: "sandbox" | "production";
  status: string;
  active: boolean;
  inTrial: boolean;
  trialDaysLeft: number;
  hasSubscription: boolean;
  currentPeriodEnd: string | null;
};

const INCLUDED = [
  "Unlimited clients and closes",
  "Automated email chasing",
  "No-login client portal",
  "QuickBooks sync and CSV import",
];

export function BillingCard(props: Props) {
  const { configured, priceId, clientToken, environment } = props;
  const paddleRef = useRef<Paddle | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, startBusy] = useTransition();
  const [portalBusy, startPortal] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientToken) return;
    initializePaddle({ environment, token: clientToken })
      .then((p) => {
        if (p) {
          paddleRef.current = p;
          setReady(true);
        }
      })
      .catch(() => setError("Could not load the checkout."));
  }, [clientToken, environment]);

  async function subscribe() {
    setError(null);
    const prep = await prepareCheckoutAction();
    if (!prep.ok || !("customerId" in prep)) {
      setError(("error" in prep && prep.error) || "Could not start checkout.");
      return;
    }
    if (!paddleRef.current || !priceId) {
      setError("Checkout is not ready yet.");
      return;
    }
    paddleRef.current.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: prep.email },
      customData: { firm_id: prep.firmId },
      settings: {
        displayMode: "overlay",
        theme: "light",
        // Land the bookkeeper back in the app once payment succeeds instead of
        // leaving them stranded on the "completed" overlay.
        successUrl: `${window.location.origin}/dashboard?subscribed=1`,
      },
    });
  }

  // A subscription that exists is "subscribed", even while trialing: a 14-day
  // trial subscription starts as `trialing` (card on file, first charge later),
  // which is an active paid relationship, not a lapsed trial.
  const subscribed =
    props.hasSubscription &&
    (props.status === "active" || props.status === "trialing" || props.status === "past_due");

  // Format in UTC so the server render and the client hydration agree on the
  // calendar day; a local-timezone format would mismatch and break hydration.
  const renewLabel = props.currentPeriodEnd
    ? new Date(props.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  const statusLabel = subscribed
    ? props.status === "past_due"
      ? "Payment past due"
      : props.status === "trialing"
        ? "Active, in trial"
        : "Active"
    : props.inTrial
      ? `Trial: ${props.trialDaysLeft} day${props.trialDaysLeft === 1 ? "" : "s"} left`
      : "Trial ended";

  const pillClass = subscribed
    ? props.status === "past_due"
      ? "pill pill-warning"
      : "pill pill-success"
    : props.inTrial
      ? "pill pill-brand"
      : "pill pill-danger";

  const subline = subscribed
    ? props.status === "trialing" && renewLabel
      ? `Your free trial runs to ${renewLabel}, then $29 a month.`
      : props.status === "past_due"
        ? "Your last payment did not go through. Update your card to stay active."
        : renewLabel
          ? `Renews ${renewLabel}.`
          : null
    : null;

  return (
    <div className="sheet p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg">RuledOff plan</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Flat 29 dollars a month. Unlimited clients. Cancel anytime.
          </p>
        </div>
        <span className={pillClass}>{statusLabel}</span>
      </div>

      <div className="mt-5 flex items-baseline gap-1.5 border-t border-line pt-5">
        <span className="num text-4xl font-extrabold text-text">$29</span>
        <span className="text-sm text-muted">/month</span>
      </div>

      <ul className="mt-5 flex flex-col gap-2.5">
        {INCLUDED.map((t) => (
          <li key={t} className="flex items-start gap-2.5 text-sm text-text">
            <Check size={17} className="mt-0.5 shrink-0 text-success" /> {t}
          </li>
        ))}
      </ul>

      {subline ? <p className="mt-4 text-sm text-ink-muted">{subline}</p> : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {subscribed ? (
          <button
            type="button"
            className="btn text-sm"
            disabled={portalBusy}
            onClick={() => startPortal(() => void openBillingPortalAction())}
          >
            {portalBusy ? "Opening" : "Manage billing"}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary text-sm"
            disabled={!configured || !ready || busy}
            onClick={() => startBusy(subscribe)}
          >
            {busy ? "Starting checkout" : props.inTrial ? "Subscribe now" : "Subscribe to continue"}
          </button>
        )}
        {!configured ? (
          <span className="text-xs text-ink-muted">
            Billing keys are not configured yet.
          </span>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
