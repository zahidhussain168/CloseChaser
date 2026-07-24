"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Check, Sparkles } from "lucide-react";
import { prepareCheckoutAction, openBillingPortalAction } from "@/app/(app)/billing-actions";

type Props = {
  configured: boolean;
  priceId: string | null;
  scalePriceId: string | null;
  clientToken: string | null;
  environment: "sandbox" | "production";
  status: string;
  active: boolean;
  inTrial: boolean;
  trialDaysLeft: number;
  hasSubscription: boolean;
  currentPeriodEnd: string | null;
  plan: string | null;
};

const FREE_INCLUDES = [
  "Unlimited clients and monthly closes",
  "No-login client portal",
  "Send a chase yourself, whenever you need to",
  "Review answers and rule off items",
  "QuickBooks sync and CSV import",
];

const PRO_ADDS = [
  "Auto-escalating reminders that stop when done",
  "Chase Everyone: the whole book in one click",
  "Auto-chase each new month, hands off",
  "Reminder cadence, templates, and live email preview",
];

const SCALE_ADDS = [
  "Close Forecast, predicted finish dates",
  "AI Close Analyst on every client",
  "SMS deadline escalation",
  "Responsiveness scoring and ranking",
  "Close Receipts, exportable as PDF",
  "Priority support",
];

function statusDot(tone: "success" | "warning" | "danger" | "brand") {
  return tone === "success" ? "#34d399" : tone === "warning" ? "#fbbf24" : tone === "danger" ? "#f87171" : "#ffffff";
}

export function BillingCard(props: Props) {
  const { configured, priceId, scalePriceId, clientToken, environment } = props;
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

  async function subscribe(chosenPriceId: string | null) {
    setError(null);
    if (!chosenPriceId) {
      setError("That plan is not available yet.");
      return;
    }
    const prep = await prepareCheckoutAction();
    if (!prep.ok || !("customerId" in prep)) {
      setError(("error" in prep && prep.error) || "Could not start checkout.");
      return;
    }
    if (!paddleRef.current) {
      setError("Checkout is not ready yet.");
      return;
    }
    paddleRef.current.Checkout.open({
      items: [{ priceId: chosenPriceId, quantity: 1 }],
      customer: { email: prep.email },
      customData: { firm_id: prep.firmId },
      settings: {
        displayMode: "overlay",
        theme: "light",
        successUrl: `${window.location.origin}/dashboard?subscribed=1`,
      },
    });
  }

  const subscribed =
    props.hasSubscription &&
    (props.status === "active" || props.status === "trialing" || props.status === "past_due");

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

  const tone: "success" | "warning" | "danger" | "brand" = subscribed
    ? props.status === "past_due"
      ? "warning"
      : "success"
    : props.inTrial
      ? "brand"
      : "danger";

  const planName = props.plan === "scale" ? "Scale" : subscribed ? "Pro" : null;
  const subline = subscribed
    ? props.status === "trialing" && renewLabel
      ? `Your free trial runs to ${renewLabel}.`
      : props.status === "past_due"
        ? "Your last payment did not go through. Update your card to stay active."
        : renewLabel
          ? `Renews ${renewLabel}.`
          : null
    : props.inTrial
      ? "Your trial includes everything in Scale. Pick a plan any time before it ends."
      : "Your trial has ended. Pick a plan to keep the premium features.";

  return (
    <div className="sheet overflow-hidden p-0">
      <div
        className="relative overflow-hidden px-6 py-5 text-white"
        style={{ background: "linear-gradient(135deg, var(--brand-solid), var(--brand-solid-2))" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.18), transparent)" }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-white/80">
              <Sparkles size={14} /> RuledOff plans
            </div>
            <p className="mt-1.5 text-[13px] text-white/70">
              {planName ? `You are on ${planName}.` : "Free, Pro, and Scale. Flat, unlimited clients, cancel anytime."}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusDot(tone) }} />
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="px-6 py-5">
        {subscribed ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[15px] font-bold text-text">RuledOff {planName}</div>
              {subline ? <p className="mt-0.5 text-sm text-ink-muted">{subline}</p> : null}
            </div>
            <button
              type="button"
              className="btn text-sm"
              disabled={portalBusy}
              onClick={() => startPortal(() => void openBillingPortalAction())}
            >
              {portalBusy ? "Opening" : "Manage billing"}
            </button>
          </div>
        ) : (
          <>
            {subline ? <p className="mb-4 text-sm text-ink-muted">{subline}</p> : null}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Free */}
              <div className="rounded-2xl border border-line p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold uppercase tracking-wide text-faint">Free</div>
                  {!props.inTrial ? (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                      Your plan
                    </span>
                  ) : null}
                </div>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="num text-3xl font-extrabold text-text">$0</span>
                  <span className="text-sm text-muted">/month</span>
                </div>
                <p className="mt-1 text-[13px] text-ink-muted">The basic collection loop, forever.</p>
                <ul className="mt-4 flex flex-col gap-2">
                  {FREE_INCLUDES.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-[13px] text-text">
                      <Check size={15} className="mt-0.5 shrink-0 text-success" /> {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 py-2 text-center text-[12.5px] text-faint">No card, nothing to do</p>
              </div>

              {/* Pro */}
              <div className="rounded-2xl border border-line p-5">
                <div className="text-[13px] font-semibold uppercase tracking-wide text-faint">Pro</div>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="num text-3xl font-extrabold text-text">$39</span>
                  <span className="text-sm text-muted">/month</span>
                </div>
                <p className="mt-1 text-[13px] text-ink-muted">Everything in Free, plus the automation.</p>
                <ul className="mt-4 flex flex-col gap-2">
                  {PRO_ADDS.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-[13px] text-text">
                      <Check size={15} className="mt-0.5 shrink-0 text-success" /> {t}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn mt-5 w-full justify-center text-sm"
                  disabled={!configured || !ready || busy || !priceId}
                  onClick={() => startBusy(() => subscribe(priceId))}
                >
                  {busy ? "Starting checkout" : "Choose Pro"}
                </button>
              </div>

              {/* Scale */}
              <div
                className="relative rounded-2xl p-[1.5px]"
                style={{ background: "linear-gradient(135deg, var(--brand), var(--brass))" }}
              >
                <div className="rounded-[15px] bg-surface p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--brass-ink)" }}>Scale</div>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "var(--brand)" }}>Most powerful</span>
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="num text-3xl font-extrabold text-text">$69</span>
                    <span className="text-sm text-muted">/month</span>
                  </div>
                  <p className="mt-1 text-[13px] text-ink-muted">Everything in Pro, plus the intelligence.</p>
                  <ul className="mt-4 flex flex-col gap-2">
                    {SCALE_ADDS.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-[13px] text-text">
                        <Sparkles size={15} className="mt-0.5 shrink-0" style={{ color: "var(--brass-ink)" }} /> {t}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="btn btn-primary mt-5 w-full justify-center text-sm disabled:opacity-60"
                    disabled={!configured || !ready || busy || !scalePriceId}
                    onClick={() => startBusy(() => subscribe(scalePriceId))}
                  >
                    {!scalePriceId ? "Scale coming soon" : busy ? "Starting checkout" : "Choose Scale"}
                  </button>
                </div>
              </div>
            </div>
            {!configured ? <p className="mt-3 text-xs text-ink-muted">Billing keys are not configured yet.</p> : null}
          </>
        )}

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
