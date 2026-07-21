"use client";

import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/site/Button";
import { Reveal } from "@/components/site/Reveal";

export function PricingCTA() {
  return (
    <section className="section-y">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="brand-wash relative overflow-hidden rounded-3xl border border-line bg-surface p-8 sm:p-14">
            <div className="relative grid gap-7 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="kicker">One flat price</p>
                <h2 className="t-h2 mt-3 font-display text-text">
                  Cheaper than the hour you spend chasing.
                </h2>
                <p className="t-body-lg mt-4 max-w-lg text-muted">
                  Unlimited clients, unlimited closes, every feature. No seats, no per-client fees,
                  no free tier to outgrow.
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

              <div className="sheet rounded-2xl p-7">
                <div className="flex items-baseline gap-1.5">
                  <span className="num text-[52px] font-extrabold leading-none text-text">$29</span>
                  <span className="text-[16px] text-muted">/month</span>
                </div>
                <p className="mt-2 text-[13px] text-muted">Flat. Unlimited clients. 14-day free trial.</p>
                <ul className="mt-6 flex flex-col gap-3">
                  {[
                    "Unlimited clients and closes",
                    "Automated email chasing",
                    "No-login client portal",
                    "QuickBooks sync and CSV import",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-[14px] text-text">
                      <Check size={17} className="mt-0.5 shrink-0 text-success" /> {t}
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
