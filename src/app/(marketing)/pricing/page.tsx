import type { Metadata } from "next";
import { Button } from "@/components/site/Button";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";

const PRICING_DESC =
  "One flat price of $39 a month. Unlimited clients, unlimited closes, every feature, and a 14-day free trial. No seats, no per-client fees.";

export const metadata: Metadata = {
  title: "Pricing",
  description: PRICING_DESC,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "RuledOff pricing: one flat price, unlimited clients",
    description: PRICING_DESC,
    url: "/pricing",
  },
};

const GREEN = "#16A34A";

function Tick() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="mt-[3px] shrink-0"
    >
      <path
        d="M5 12.5 10 17.5 19 6.5"
        stroke={GREEN}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const INCLUDED = [
  "Unlimited clients and monthly closes",
  "A no-login magic link for every client",
  "Email reminders that escalate in tone, then stop the moment items come in",
  "Photo and file uploads, answers saved instantly",
  "The dashboard sorted by what is most blocking the close",
  "Your firm's name and branding on every link and email",
  "QuickBooks Online sync and CSV import (rolling out)",
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
    a: "No free plan, but every account starts with a 14-day free trial so you can run a real close before you pay.",
  },
  {
    q: "Do you charge per client?",
    a: "No. It is 39 dollars a month, flat, for unlimited clients and unlimited closes.",
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
            One price. Every client.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-site-secondary">
            No seats, no per-client fees, no free tier to outgrow. One flat price
            for as many clients and closes as you can take on.
          </p>
        </div>

        <Reveal className="mx-auto mt-14 max-w-lg">
          <div
            className="rounded-[12px] border border-site-border bg-site-white p-8 sm:p-10"
            style={{
              boxShadow:
                "0 1px 0 rgba(17,19,21,0.03), 0 30px 56px -34px rgba(17,19,21,0.24)",
            }}
          >
            <div className="flex items-baseline justify-center gap-1.5 border-b border-site-border pb-7">
              <span className="font-mono text-[56px] leading-none tabular-nums text-site-ink">
                $39
              </span>
              <span className="text-[17px] text-site-secondary">/month</span>
            </div>
            <p className="mt-5 text-center text-[14px] text-site-secondary">
              Flat. Unlimited clients. 14-day free trial.
            </p>
            <Button href="/signup" className="mt-6 w-full justify-center">
              Start your 14-day trial
            </Button>
            <ul className="mt-9 flex flex-col gap-3.5">
              {INCLUDED.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[15px] leading-snug">
                  <Tick />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 border-t border-site-border pt-5 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-site-secondary">
              No lock-in. Cancel anytime.
            </p>
          </div>
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
