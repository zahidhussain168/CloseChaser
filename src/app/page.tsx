import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/Wordmark";
import { Reveal } from "@/components/marketing/Reveal";
import { LedgerHero } from "@/components/marketing/LedgerHero";
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
        <section className="relative mx-auto max-w-6xl px-6 pb-[160px] pt-20">
          <span className="folio">01</span>
          <Wordmark size={28} />
          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h1
                className="font-display font-semibold"
                style={{ fontSize: "clamp(44px, 6.4vw, 88px)", lineHeight: 1.02 }}
              >
                Chase the close, not your clients.
              </h1>
              <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-muted">
                RuledOff finds what is blocking a client&apos;s month-end and
                chases them for it with a branded link they open on their phone.
                No account, no login, no download. When every item is answered,
                the books are{" "}
                <span className="font-display" style={{ color: "var(--cleared)" }}>
                  ruled off
                </span>
                .
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link
                  href="/signup"
                  className="btn btn-primary px-6 py-3.5 text-base"
                >
                  Create your firm
                </Link>
                <Link
                  href="/login"
                  className="text-sm text-ink-muted underline decoration-1 underline-offset-4 transition-colors hover:text-ink"
                >
                  Sign in
                </Link>
              </div>
              <p className="mt-14 text-sm text-ink-muted">
                Built for solo bookkeepers.{" "}
                <span className="num" style={{ color: "var(--ink)" }}>
                  $29
                </span>
                /mo flat, unlimited clients.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <LedgerHero />
            </div>
          </div>
        </section>

        {/* 2. The problem: the one dark band */}
        <section className="ink-band relative">
          <span className="folio">02</span>
          <div className="mx-auto max-w-5xl px-6 py-[160px]">
            <p className="kicker" style={{ color: "#6fb094" }}>
              The problem
            </p>
            <blockquote
              className="mt-5 max-w-3xl font-display font-semibold"
              style={{ fontSize: "clamp(36px, 5vw, 72px)", lineHeight: 1.05 }}
            >
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
                  <span
                    className="num block text-4xl"
                    style={{ color: "var(--paper)" }}
                  >
                    {s.n}
                  </span>
                  <span
                    className="mt-1.5 block text-sm"
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
        <Reveal
          as="section"
          className="relative mx-auto max-w-5xl px-6 py-[120px]"
        >
          <span className="folio">03</span>
          <p className="kicker">How it works</p>
          <h2
            className="mt-4 font-display font-semibold"
            style={{ fontSize: "clamp(28px, 4vw, 46px)", lineHeight: 1.08 }}
          >
            Three steps to a closed month.
          </h2>
          <ol className="mt-10 grid gap-10 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                className="step"
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <CircledNumber n={s.n} />
                <div className="ink-rule my-4 max-w-[3rem]" />
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Rule />

        {/* 4. What it catches */}
        <Reveal
          as="section"
          className="relative mx-auto max-w-5xl px-6 py-[104px]"
        >
          <span className="folio">04</span>
          <p className="kicker">What it catches</p>
          <h2
            className="mt-4 max-w-2xl font-display font-semibold"
            style={{ fontSize: "clamp(28px, 4vw, 46px)", lineHeight: 1.08 }}
          >
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
                  transitionDelay: `${i * 70}ms`,
                }}
              >
                <span
                  className="num text-sm"
                  style={{ color: "var(--pending)" }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[17px]">{c}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Rule />

        {/* 5. The chase */}
        <Reveal
          as="section"
          className="relative mx-auto max-w-5xl px-6 py-[112px]"
        >
          <span className="folio">05</span>
          <p className="kicker">The chase</p>
          <h2
            className="mt-4 max-w-2xl font-display font-semibold"
            style={{ fontSize: "clamp(28px, 4vw, 46px)", lineHeight: 1.08 }}
          >
            Reminders that get results, then stop.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
            Escalation by words, not noise. The same client, the same inbox, a
            firmer tone each time.
          </p>
          <div className="mt-10 grid gap-px sm:grid-cols-3">
            {LADDER.map((l, i) => (
              <div
                key={l.day}
                className="step px-1 py-4"
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <span className="num block text-sm text-ink-muted">{l.day}</span>
                <div className="ink-rule my-3" />
                <p className="text-[17px] leading-snug">{l.line}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-xl text-[15px] leading-relaxed text-ink-muted">
            The instant every item is answered, the chasing ends. You never
            pester a client who already delivered.
          </p>
        </Reveal>

        <Rule />

        {/* 6. Pricing */}
        <Reveal
          as="section"
          className="relative mx-auto max-w-5xl px-6 py-[140px] text-center"
        >
          <span className="folio">06</span>
          <p className="kicker">Pricing</p>
          <h2
            className="mt-4 font-display font-semibold"
            style={{ fontSize: "clamp(30px, 5vw, 58px)", lineHeight: 1.05 }}
          >
            One price. Every client.
          </h2>
          <p className="num mt-6 text-5xl" style={{ color: "var(--ink)" }}>
            $29
            <span className="text-lg text-ink-muted">/mo</span>
          </p>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-ink-muted">
            Flat monthly price, unlimited clients, a 14-day trial. Close more
            books without hiring, without nagging, and without another portal
            your clients ignore.
          </p>
          <div className="mx-auto mt-8 flex max-w-xs flex-col items-center gap-4">
            <Link
              href="/signup"
              className="btn btn-primary w-full px-6 py-3.5 text-base"
            >
              Create your firm
            </Link>
            <Link
              href="/login"
              className="text-sm text-ink-muted underline decoration-1 underline-offset-4 transition-colors hover:text-ink"
            >
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
          <Wordmark size={18} />
          <p className="text-sm text-ink-muted">Close the books. Ruled off.</p>
        </footer>
      </main>
    </>
  );
}
