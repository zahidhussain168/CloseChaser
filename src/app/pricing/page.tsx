import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { Reveal } from "@/components/marketing/Reveal";
import { FooterCeremony } from "@/components/marketing/FooterCeremony";

export const metadata = {
  title: "Pricing · RuledOff",
  description: "One flat price. Unlimited clients. Every close, ruled off.",
};

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cleared)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
      <path d="M20 6 9 17l-5-5" />
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

const FAQ = [
  {
    q: "Is there a free plan?",
    a: "No free plan, but every account starts with a 14-day free trial so you can run a real close before you pay.",
  },
  {
    q: "Do you charge per client?",
    a: "No. It is 29 dollars a month, flat, for unlimited clients and unlimited closes.",
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
    <>
      <header
        className="sticky top-0 z-40"
        style={{
          background: "color-mix(in srgb, var(--paper) 88%, transparent)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 backdrop-blur">
          <Link href="/" className="tap">
            <Wordmark size={20} />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="tap text-sm text-ink-muted hover:text-ink">
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-primary px-4 text-sm">
              Create your firm
            </Link>
          </div>
        </div>
      </header>

      <main className="page-enter">
        {/* Hero + plan */}
        <section className="section-y relative mx-auto max-w-5xl px-6 text-center">
          <p className="kicker">Pricing</p>
          <h1 className="t-display mt-4 font-display font-semibold">
            One price. Every client.
          </h1>
          <p className="t-body-lg mx-auto mt-5 max-w-xl text-ink-muted">
            No seats, no per-client fees, no free tier to outgrow. One flat
            price for as many clients and closes as you can take on.
          </p>

          <div className="sheet spot mx-auto mt-12 max-w-lg p-8 text-left">
            <div className="flex items-baseline justify-center gap-1">
              <span className="num text-6xl" style={{ color: "var(--ink)" }}>
                $29
              </span>
              <span className="text-lg text-ink-muted">/month</span>
            </div>
            <p className="mt-2 text-center text-sm text-ink-muted">
              Flat. Unlimited clients. 14-day free trial.
            </p>
            <Link
              href="/signup"
              className="btn btn-primary mt-7 w-full px-6 text-base"
            >
              Start your 14-day trial
            </Link>
            <ul className="mt-8 flex flex-col gap-3">
              {INCLUDED.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[15px]">
                  <Check />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-xs text-ink-muted">
              No per-client fees. No lock-in. Cancel anytime.
            </p>
          </div>
        </section>

        <div className="border-t" style={{ borderColor: "var(--rule)" }} />

        {/* Why one flat price */}
        <Reveal as="section" className="section-y relative mx-auto max-w-5xl px-6">
          <p className="kicker">Why flat</p>
          <h2 className="h2-float t-h2 mt-4 max-w-2xl font-display font-semibold">
            Cheaper than the hour you spend chasing.
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="step">
              <h3 className="t-h3 font-display font-semibold">vs email and spreadsheets</h3>
              <p className="t-body mt-1.5 text-ink-muted">
                No tracking, no auto-reminders, no sense of what is actually
                blocking the close. You become the reminder system.
              </p>
            </div>
            <div className="step">
              <h3 className="t-h3 font-display font-semibold">vs practice suites</h3>
              <p className="t-body mt-1.5 text-ink-muted">
                The big platforms charge per seat and do fifty things. RuledOff
                does one job, closing the books, and does it well.
              </p>
            </div>
            <div className="step">
              <h3 className="t-h3 font-display font-semibold">vs doing it yourself</h3>
              <p className="t-body mt-1.5 text-ink-muted">
                One close that lands on time, instead of a week late, is worth
                more than the whole month costs.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="border-t" style={{ borderColor: "var(--rule)" }} />

        {/* FAQ */}
        <Reveal as="section" className="section-y relative mx-auto max-w-3xl px-6">
          <p className="kicker">Questions</p>
          <h2 className="h2-float t-h2 mt-4 font-display font-semibold">
            The short answers.
          </h2>
          <dl className="mt-8 border-t" style={{ borderColor: "var(--rule)" }}>
            {FAQ.map((item, i) => (
              <div
                key={item.q}
                className="step border-b py-6"
                style={{ borderColor: "var(--rule)", transitionDelay: `${i * 40}ms` }}
              >
                <dt className="font-display text-lg font-semibold">{item.q}</dt>
                <dd className="t-body mt-2 text-ink-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <div className="border-t" style={{ borderColor: "var(--rule)" }} />

        <FooterCeremony />

        <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-10">
          <Link href="/" className="tap">
            <Wordmark size={18} />
          </Link>
          <p className="t-small text-ink-muted">Close the books. Ruled off.</p>
        </footer>
      </main>
    </>
  );
}
