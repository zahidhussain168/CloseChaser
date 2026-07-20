import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/Wordmark";
import { Reveal } from "@/components/marketing/Reveal";
import { Hero } from "@/components/marketing/Hero";
import { Counter } from "@/components/marketing/Counter";
import { StickyNav } from "@/components/marketing/StickyNav";
import { CircledNumber } from "@/components/marketing/CircledNumber";
import { FooterCeremony } from "@/components/marketing/FooterCeremony";

export const metadata = {
  title: "RuledOff: chase the close, not your clients",
};

const STATS = [
  { n: "9", label: "days lost to back and forth" },
  { n: "5", label: "emails to get one receipt" },
  { n: "0", label: "portals your client accepts" },
];

const STEPS = [
  {
    n: "01",
    title: "Add your clients",
    body: "Connect QuickBooks Online, or add a client by hand. Both work from day one.",
  },
  {
    n: "02",
    title: "Fire the chase",
    body: "RuledOff finds what is blocking the close and emails your client a branded, no-login link.",
  },
  {
    n: "03",
    title: "Watch it rule off",
    body: "They answer and upload. Each item gets ruled off, and the reminders stop the moment nothing is left.",
  },
];

const CATCHES = [
  "Uncategorized transactions",
  "Ask My Accountant entries",
  "Missing receipts, statements, and W-9s",
  "Anything you add by hand, like a December bank statement",
];

const LADDER = [
  { day: "Day 2", line: "A friendly nudge." },
  { day: "Day 5", line: "Specific, with a deadline." },
  { day: "Day 9", line: "The honest one. Late books mean late taxes." },
];

const QUIET_LINK =
  "tap text-sm text-ink-muted underline decoration-1 underline-offset-4 transition-colors hover:text-ink";

function Rule() {
  return <div className="border-t" style={{ borderColor: "var(--rule)" }} />;
}

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <>
      <StickyNav />
      <div className="ledger-margin" aria-hidden="true" />
      <div className="paper-grain" aria-hidden="true" />

      <main className="page-enter">
        {/* 1. Hero */}
        <Hero />

        {/* 2. The problem: the one dark band */}
        <section className="ink-band section-y-hero relative">
          <span className="folio">02</span>
          <div className="mx-auto max-w-5xl px-6">
            <p className="kicker" style={{ color: "#6fb094" }}>
              The problem
            </p>
            <blockquote className="t-display mt-5 max-w-3xl font-display font-semibold">
              The books were done a week ago. The month is{" "}
              <span style={{ color: "var(--pending-bright)" }}>still waiting</span>{" "}
              on the client.
            </blockquote>
            <div
              className="mt-14 grid gap-8 border-t pt-8 sm:grid-cols-3"
              style={{ borderColor: "rgba(242, 245, 239, 0.15)" }}
            >
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className={i > 0 ? "sm:border-l sm:pl-8" : ""}
                  style={{ borderColor: "rgba(242, 245, 239, 0.15)" }}
                >
                  <Counter
                    to={Number(s.n)}
                    className="num block text-4xl"
                    style={{ color: "var(--paper)" }}
                  />
                  <span
                    className="t-small mt-1.5 block"
                    style={{ color: "rgba(242, 245, 239, 0.72)" }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. How it works */}
        <Reveal as="section" className="section-y relative mx-auto max-w-5xl px-6">
          <span className="folio">03</span>
          <p className="kicker">How it works</p>
          <h2 className="h2-float t-h2 mt-4 font-display font-semibold">
            Three steps to a closed month.
          </h2>
          <ol className="mt-10 grid gap-10 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                className="step"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <CircledNumber n={s.n} />
                <div className="ink-rule my-4 max-w-[3rem]" />
                <h3 className="t-h3 font-display font-semibold">{s.title}</h3>
                <p className="t-body mt-1.5 text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Rule />

        {/* 4. What it catches */}
        <Reveal as="section" className="section-y relative mx-auto max-w-5xl px-6">
          <span className="folio">04</span>
          <p className="kicker">What it catches</p>
          <h2 className="h2-float t-h2 mt-4 max-w-2xl font-display font-semibold">
            It knows what holds up the books.
          </h2>
          <ul
            className="mt-8 max-w-2xl border-t"
            style={{ borderColor: "var(--rule)" }}
          >
            {CATCHES.map((c, i) => (
              <li
                key={c}
                className="step grid grid-cols-[2rem_1fr] items-baseline gap-2 border-b py-4"
                style={{
                  borderColor: "var(--rule)",
                  transitionDelay: `${i * 40}ms`,
                }}
              >
                <span
                  className="num text-sm"
                  style={{ color: "var(--pending)" }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="t-body-lg">{c}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Rule />

        {/* 5. The chase */}
        <Reveal as="section" className="section-y relative mx-auto max-w-5xl px-6">
          <span className="folio">05</span>
          <p className="kicker">The chase</p>
          <h2 className="h2-float t-h2 mt-4 max-w-2xl font-display font-semibold">
            Reminders that get results, then stop.
          </h2>
          <p className="t-body-lg mt-6 max-w-xl text-ink-muted">
            Escalation by words, not noise. The same client, the same inbox, a
            firmer tone each time.
          </p>
          <div className="mt-10 grid gap-px sm:grid-cols-3">
            {LADDER.map((l, i) => (
              <div
                key={l.day}
                className="step px-1 py-4"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <span className="num block text-sm text-ink-muted">{l.day}</span>
                <div className="ink-rule my-3" />
                <p className="t-body-lg leading-snug">{l.line}</p>
              </div>
            ))}
          </div>
          <p className="t-body mt-10 max-w-xl text-ink-muted">
            The instant every item is answered, the chasing ends. You never
            pester a client who already delivered.
          </p>
        </Reveal>

        <Rule />

        {/* 6. Pricing */}
        <Reveal
          as="section"
          className="section-y relative mx-auto max-w-5xl px-6 text-center"
        >
          <span className="folio">06</span>
          <p className="kicker">Pricing</p>
          <h2 className="h2-float t-h2 mt-4 font-display font-semibold">
            One price. Every client.
          </h2>
          <p className="num mt-6 text-5xl" style={{ color: "var(--ink)" }}>
            $29
            <span className="text-lg text-ink-muted">/mo</span>
          </p>
          <p className="t-body mx-auto mt-5 max-w-md text-ink-muted">
            Flat monthly price, unlimited clients, a 14-day trial. Close more
            books without hiring, without nagging, and without another portal
            your clients ignore.
          </p>
          <div className="mx-auto mt-8 flex max-w-xs flex-col items-center gap-4">
            <Link href="/signup" className="btn btn-primary w-full px-6 text-base">
              Create your firm
            </Link>
            <Link href="/login" className={QUIET_LINK}>
              Sign in
            </Link>
          </div>
        </Reveal>

        <Rule />

        {/* Footer ceremony */}
        <FooterCeremony />

        <Rule />

        {/* Footer */}
        <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-10">
          <Link href="/" className="tap" aria-label="RuledOff home">
            <Wordmark size={18} />
          </Link>
          <p className="t-small text-ink-muted">Close the books. Ruled off.</p>
        </footer>
      </main>
    </>
  );
}
