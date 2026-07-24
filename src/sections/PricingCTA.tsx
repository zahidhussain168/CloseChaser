"use client";

import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/site/Button";
import { Reveal } from "@/components/site/Reveal";

const PLAN_FEATURES: { label: string; pro?: boolean }[] = [
  { label: "Close Forecast, predicted finish dates", pro: true },
  { label: "AI Close Analyst on every client", pro: true },
  { label: "Chase Everyone in one click", pro: true },
  { label: "Auto-chase each new month", pro: true },
  { label: "Unlimited clients and closes" },
  { label: "No-login client portal" },
  { label: "QuickBooks sync and CSV import" },
  { label: "Reminder cadence and email templates" },
];

export function PricingCTA() {
  return (
    <section className="section-y bg-surface-2">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="brand-wash relative overflow-hidden rounded-3xl border border-line bg-surface p-8 sm:p-14">
            <div className="relative grid gap-7 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="kicker">Free to start, flat to grow</p>
                <h2 className="t-h2 mt-3 font-display text-text">
                  Cheaper than the hour you spend chasing.
                </h2>
                <p className="t-body-lg mt-4 max-w-lg text-muted">
                  Unlimited clients and unlimited closes on every plan, including free.
                  No seats and no per-client fees, ever.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button href="/signup" size="lg">
                    Start your 14-day trial <ArrowRight size={18} />
                  </Button>
                  <Button href="/pricing" variant="secondary" size="lg">
                    See pricing
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                <div
                  className="relative overflow-hidden px-7 py-6 text-white"
                  style={{ background: "linear-gradient(135deg, var(--brand-solid), var(--brand-solid-2))" }}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full"
                    style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.18), transparent)" }}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-white/80">
                      <Sparkles size={14} /> RuledOff Pro
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="num text-[46px] font-extrabold leading-none">$39</span>
                      <span className="text-[15px] text-white/70">/month</span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-white/70">Flat, unlimited clients, 14-day free trial.</p>
                  </div>
                </div>
                <ul className="grid gap-x-5 gap-y-2.5 px-7 py-6">
                  {PLAN_FEATURES.map((f) => (
                    <li key={f.label} className="flex items-start gap-2.5 text-[13.5px] text-text">
                      {f.pro ? (
                        <Sparkles size={16} className="mt-0.5 shrink-0" style={{ color: "var(--brass-ink)" }} />
                      ) : (
                        <Check size={16} className="mt-0.5 shrink-0 text-success" />
                      )}
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
