"use client";

import { MailCheck, Smartphone, RefreshCw, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

type Feature = { icon: LucideIcon; title: string; body: string };

const FEATURES: Feature[] = [
  {
    icon: MailCheck,
    title: "Automated chasing",
    body: "A calm sequence of emails goes out on your schedule, each one firmer than the last, and stops the instant your client responds.",
  },
  {
    icon: Smartphone,
    title: "No-login client portal",
    body: "Your client taps a link and answers on their phone. No account, no password, no app to download. Nothing to abandon.",
  },
  {
    icon: RefreshCw,
    title: "QuickBooks sync",
    body: "Pull uncategorized charges and Ask My Accountant entries straight in, and push the answers and receipts back automatically.",
  },
  {
    icon: LayoutDashboard,
    title: "Month-end overview",
    body: "Every client sorted by what is still blocking the close, with progress rings and status pills you can read at a glance.",
  },
];

export function Features() {
  return (
    <section id="features" className="section-y">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="max-w-2xl">
          <p className="kicker">Everything the close needs</p>
          <h2 className="t-h2 mt-3 font-display text-text">
            One quiet system that does the chasing for you.
          </h2>
          <p className="t-body-lg mt-4 text-muted">
            RuledOff replaces the spreadsheet, the sticky notes, and the awkward follow-up emails
            with a workflow that runs itself.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-3.5 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 0.06}>
                <div className="sheet lift h-full rounded-2xl p-5 sm:p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand-tint">
                    <Icon size={22} strokeWidth={2} />
                  </span>
                  <h3 className="mt-5 text-[17px] font-bold text-text">{f.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{f.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
