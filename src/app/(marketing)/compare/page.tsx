import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";

const DESC =
  "See how RuledOff compares to other tools bookkeepers use to collect documents and clear uncategorized transactions.";

export const metadata: Metadata = {
  title: "Compare RuledOff",
  description: DESC,
  alternates: { canonical: "/compare" },
  openGraph: { title: "Compare RuledOff", description: DESC, url: "/compare" },
};

type Comparison = {
  href: string;
  vs: string;
  blurb: string;
  status: "live" | "soon";
};

const COMPARISONS: Comparison[] = [
  {
    href: "/compare/double",
    vs: "RuledOff vs Double",
    blurb:
      "Double (formerly Keeper) is a deep close suite priced per client. RuledOff is single-purpose and flat, with a predicted close date per client.",
    status: "live",
  },
  {
    href: "/compare/uncat",
    vs: "RuledOff vs Uncat",
    blurb:
      "Uncat clears uncategorized transactions per client. RuledOff does that plus documents and questionnaires, flat for unlimited clients.",
    status: "live",
  },
  {
    href: "/compare/content-snare",
    vs: "RuledOff vs Content Snare",
    blurb:
      "Content Snare is general document collection. See why RuledOff fits the bookkeeping close, with QuickBooks writeback built in.",
    status: "live",
  },
  {
    href: "/compare/best-document-collection-tools",
    vs: "Best document collection tools",
    blurb:
      "A ranked roundup of the tools bookkeepers use to collect what is blocking the month-end close.",
    status: "live",
  },
];

export default function CompareHubPage() {
  return (
    <main>
      <SiteNav />

      <section className="mx-auto max-w-5xl px-6 sm:px-8 pb-12 pt-8 lg:pt-14">
        <Reveal className="max-w-2xl">
          <p className="kicker">Compare</p>
          <h1 className="mt-5 font-editorial text-[clamp(36px,5vw,60px)] font-medium leading-[1.06] tracking-[-0.01em] text-site-ink">
            How RuledOff compares.
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-site-secondary">
            Honest, side-by-side looks at the tools bookkeepers reach for when they
            need documents, receipts, and answers from a client. Pricing is kept
            current, and we say plainly where another tool is the better fit.
          </p>
        </Reveal>
      </section>

      <section className="border-t border-site-border bg-site-paper">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 py-16">
          <div className="grid gap-5 sm:grid-cols-2">
            {COMPARISONS.map((c, i) => {
              const live = c.status === "live";
              const Card = (
                <div
                  className={
                    "flex h-full flex-col rounded-[12px] border border-site-border bg-site-white p-6 transition-colors " +
                    (live ? "hover:border-brass" : "opacity-70")
                  }
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        "font-mono text-[11px] uppercase tracking-[0.12em] " +
                        (live ? "text-brass-ink" : "text-site-secondary")
                      }
                    >
                      {live ? "Read now" : "Coming soon"}
                    </span>
                  </div>
                  <h2 className="mt-3 font-editorial text-[22px] font-medium tracking-[-0.01em] text-site-ink">
                    {c.vs}
                  </h2>
                  <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-site-secondary">
                    {c.blurb}
                  </p>
                  {live && (
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand">
                      See the comparison
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </span>
                  )}
                </div>
              );
              return (
                <Reveal key={c.vs} delay={i * 0.06}>
                  {live ? (
                    <Link href={c.href} className="block h-full">
                      {Card}
                    </Link>
                  ) : (
                    <div className="h-full">{Card}</div>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
