"use client";

import { Reveal } from "@/components/site/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Connect your books",
    body: "Link QuickBooks or add manual requests. RuledOff detects the uncategorized charges and missing documents holding up the close.",
  },
  {
    n: "02",
    title: "It chases your client",
    body: "One branded link goes out. Your client answers and uploads from their phone while RuledOff sends the reminders so you never have to.",
  },
  {
    n: "03",
    title: "Everything gets ruled off",
    body: "Answers and receipts post back to your books. Each item marks itself done, and the month closes on time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="section-y bg-surface-2/60">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="max-w-2xl">
          <p className="kicker">How it works</p>
          <h2 className="t-h2 mt-3 font-display text-text">Three steps to a closed month.</h2>
        </Reveal>

        <div className="relative mt-8 grid gap-3.5 sm:mt-12 sm:gap-6 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-brand/40 via-line to-success/40 md:block" />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="sheet relative h-full rounded-2xl p-6 sm:p-7">
                <span className="num flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-[15px] font-bold text-white shadow-brand">
                  {s.n}
                </span>
                <h3 className="mt-5 text-[18px] font-bold text-text">{s.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
