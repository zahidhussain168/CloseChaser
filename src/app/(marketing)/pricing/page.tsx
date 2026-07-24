import type { Metadata } from "next";
import { Button } from "@/components/site/Button";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";

const PRICING_DESC =
  "A free plan that keeps working, Pro at $39 a month, and Scale at $69. Unlimited clients and closes on every plan, plus a 14-day trial of everything. No seats, no per-client fees.";

export const metadata: Metadata = {
  title: "Pricing",
  description: PRICING_DESC,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "RuledOff pricing: free to start, flat to grow",
    description: PRICING_DESC,
    url: "/pricing",
  },
};

const GREEN = "#16A34A";
const BRASS = "#C49A2A";

function Tick() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-[3px] shrink-0">
      <path d="M5 12.5 10 17.5 19 6.5" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Star() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={BRASS} aria-hidden="true" className="mt-[3px] shrink-0">
      <path d="M12 2.2l2.5 6.4 6.8.5-5.2 4.4 1.7 6.6L12 16.9 6.2 20.7l1.7-6.6-5.2-4.4 6.8-.5z" />
    </svg>
  );
}

const FREE_LIST = [
  "Unlimited clients and monthly closes",
  "A no-login magic link for every client",
  "Send a chase yourself, whenever you need to",
  "Review answers and rule off items",
  "QuickBooks Online sync and CSV import (rolling out)",
];

const PRO_LIST = [
  "Reminders that escalate in tone, then stop the moment items come in",
  "Chase everyone: the whole book in one click",
  "Auto-chase each new month, hands off",
  "Your firm's branding, templates, and live email preview",
];

const SCALE_LIST = [
  "Close Forecast: a predicted finish date for every client",
  "AI Close Analyst that picks the next move per client",
  "SMS deadline escalation as the close date nears",
  "Responsiveness scoring, your clients ranked",
  "Close Receipts: a proof-of-close PDF per client",
  "Priority support",
];

const COMPARE = [
  {
    title: "vs email and spreadsheets",
    body: "No tracking, no auto-reminders, no sense of what is actually blocking the close. You become the reminder system.",
  },
  {
    title: "vs practice suites",
    body: "The big platforms charge per seat and do fifty things. RuledOff does one job, closing the books, and does it well.",
  },
  {
    title: "vs doing it yourself",
    body: "One close that lands on time, instead of a week late, is worth more than the whole month costs.",
  },
];

const FAQ = [
  {
    q: "Is there a free plan?",
    a: "Yes. Free keeps the basic collection loop running for unlimited clients, with no card and no time limit. Every account also starts with a 14-day trial of everything in Scale, so you can run a real close on the full product first.",
  },
  {
    q: "Do you charge per client?",
    a: "Never. Every plan is flat: Free at nothing, Pro at 39 dollars a month, Scale at 69, each for unlimited clients and unlimited closes. The price never changes as you grow.",
  },
  {
    q: "Do my clients need an account?",
    a: "Never. They open a link on their phone, answer what they can, and they are done. No login, no app, no download.",
  },
  {
    q: "I only have a few clients. Is it worth it?",
    a: "The first close that lands on time usually pays for the month. And the price never changes as you take on more clients.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel in a click. No lock-in and no per-client math to unwind.",
  },
  {
    q: "Does it connect to QuickBooks?",
    a: "QuickBooks Online sync is rolling out. Manual requests work today, and a CSV import lets you pull transactions in without waiting on API review.",
  },
];

export default function PricingPage() {
  return (
    <main>
      <SiteNav />

      {/* Price */}
      <section className="mx-auto max-w-5xl px-6 sm:px-8 pb-24 pt-8 lg:pt-14">
        <div className="text-center">
          <p className="kicker">Pricing</p>
          <h1 className="mt-5 font-editorial text-[clamp(40px,5.4vw,72px)] font-medium leading-[1.04] tracking-[-0.01em] text-site-ink">
            Start free. Grow flat.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-site-secondary">
            No seats and no per-client fees, ever. A free plan that keeps working,
            and flat pricing for as many clients and closes as you can take on.
          </p>
        </div>

        <Reveal className="mx-auto mt-14 max-w-5xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Free */}
            <div className="flex flex-col rounded-[12px] border border-site-border bg-site-white p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-site-secondary">Free</p>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-mono text-[44px] leading-none tabular-nums text-site-ink">$0</span>
                <span className="text-[16px] text-site-secondary">/month</span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-site-secondary">The basic collection loop, forever.</p>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {FREE_LIST.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[14.5px] leading-snug">
                    <Tick />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button href="/signup" variant="secondary" className="mt-7 w-full justify-center">
                Start free
              </Button>
            </div>

            {/* Pro */}
            <div className="flex flex-col rounded-[12px] border border-site-border bg-site-white p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-site-secondary">Pro</p>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-mono text-[44px] leading-none tabular-nums text-site-ink">$39</span>
                <span className="text-[16px] text-site-secondary">/month</span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-site-secondary">Everything in Free, plus the automation.</p>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {PRO_LIST.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[14.5px] leading-snug">
                    <Tick />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button href="/signup" variant="secondary" className="mt-7 w-full justify-center">
                Start with Pro
              </Button>
            </div>

            {/* Scale */}
            <div
              className="flex flex-col rounded-[13px] p-[1.5px]"
              style={{ background: "linear-gradient(150deg, #c49a2a, #8a6a1a)" }}
            >
              <div className="flex flex-1 flex-col rounded-[12px] bg-site-white p-7">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brass-ink">Scale</p>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white" style={{ background: "#8a6a1a" }}>
                    Most powerful
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-mono text-[44px] leading-none tabular-nums text-site-ink">$69</span>
                  <span className="text-[16px] text-site-secondary">/month</span>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-site-secondary">Everything in Pro, plus the intelligence.</p>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {SCALE_LIST.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[14.5px] leading-snug">
                      <Star />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button href="/signup" className="mt-7 w-full justify-center">
                  Start with Scale
                </Button>
              </div>
            </div>
          </div>
          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-site-secondary">
            Free forever on the basics. 14-day trial of everything. No lock-in.
          </p>
        </Reveal>
      </section>

      {/* Why flat */}
      <section className="border-t border-site-border bg-site-paper">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 py-24">
          <Reveal>
            <p className="kicker">Why flat</p>
            <h2 className="mt-5 max-w-2xl font-editorial text-[clamp(28px,4vw,46px)] font-medium leading-[1.08] tracking-[-0.01em] text-site-ink">
              Cheaper than the hour you spend chasing.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {COMPARE.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.08}>
                <div className="border-t border-site-border pt-5">
                  <h3 className="text-[16px] font-semibold text-site-ink">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-site-secondary">
                    {c.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-site-border bg-site-bg">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 py-24">
          <Reveal>
            <p className="kicker">Questions</p>
            <h2 className="mt-5 font-editorial text-[clamp(28px,4vw,46px)] font-medium leading-[1.08] tracking-[-0.01em] text-site-ink">
              The short answers.
            </h2>
          </Reveal>
          <dl className="mt-10 border-t border-site-border">
            {FAQ.map((item, i) => (
              <Reveal key={item.q} delay={Math.min(i, 3) * 0.05} amount={0.4}>
                <div className="grid gap-2 border-b border-site-border py-7 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8">
                  <dt className="text-[16px] font-semibold text-site-ink">
                    {item.q}
                  </dt>
                  <dd className="text-[15px] leading-relaxed text-site-secondary">
                    {item.a}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Close */}
      <section className="border-t border-site-border bg-site-paper">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 py-24 text-center">
          <Reveal>
            <h2 className="font-editorial text-[clamp(30px,4.4vw,52px)] font-medium leading-[1.06] tracking-[-0.01em] text-site-ink">
              Run one close on us.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-site-secondary">
              Fourteen days, every feature, no card. If it does not save you an
              afternoon, walk away.
            </p>
            <div className="mt-9 flex justify-center">
              <Button href="/signup">Start your 14-day trial</Button>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
