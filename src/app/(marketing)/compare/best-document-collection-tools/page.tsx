import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/site/Button";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { JsonLd } from "@/components/site/JsonLd";

const DESC =
  "A ranked, honest roundup of the best client document collection tools for bookkeepers in 2026: RuledOff, Uncat, Content Snare, and Client Hub, with pricing and who each fits.";

export const metadata: Metadata = {
  title: { absolute: "Best Client Document Collection Tools for Bookkeepers (2026)" },
  description: DESC,
  alternates: { canonical: "/compare/best-document-collection-tools" },
  openGraph: {
    title: "Best client document collection tools for bookkeepers (2026)",
    description: DESC,
    url: "/compare/best-document-collection-tools",
  },
};

const SITE = "https://ruledoff.vercel.app";

type Tool = {
  rank: number;
  name: string;
  url: string;
  internal?: string;
  price: string;
  bestFor: string;
  summary: string;
  honest: string;
  ours?: boolean;
};

const TOOLS: Tool[] = [
  {
    rank: 1,
    name: "RuledOff",
    url: "/signup",
    price: "$39/mo flat, unlimited clients",
    bestFor: "The whole bookkeeping close",
    summary:
      "Purpose-built for the month-end close. Pulls uncategorized transactions from QuickBooks, collects documents and questionnaires on one no-login link, chases the client automatically, and posts answers and receipts back to the books.",
    honest:
      "The newest tool here, and Xero support is still on the roadmap. If your work is the bookkeeping close, it does the most for the least.",
    ours: true,
  },
  {
    rank: 2,
    name: "Uncat",
    url: "https://www.uncat.com/",
    internal: "/compare/uncat",
    price: "$9/mo per client",
    bestFor: "Pure transaction cleanup",
    summary:
      "A clean, cheap way to get clients to explain uncategorized transactions and attach receipts, syncing with QuickBooks and Xero.",
    honest:
      "Priced per client, so the bill grows with your book, and it only handles transactions, not documents or questionnaires.",
  },
  {
    rank: 3,
    name: "Content Snare",
    url: "https://contentsnare.com/",
    internal: "/compare/content-snare",
    price: "From $35/mo, billed annually",
    bestFor: "General document collection",
    summary:
      "A flexible request-and-form tool used across accounting, legal, and finance, with a strong template library and unlimited reminders.",
    honest:
      "Not bookkeeping-specific, with no QuickBooks connection, and client limits on the lower tiers.",
  },
  {
    rank: 4,
    name: "Client Hub",
    url: "https://www.clienthub.app/",
    price: "Per-user pricing",
    bestFor: "A full practice suite",
    summary:
      "A practice-management platform with a client portal and a QuickBooks flow for uncategorized transactions, plus tasks and workflows.",
    honest:
      "More than a collection tool, and priced per user, so it is a bigger commitment if all you need is to gather what is blocking the close.",
  },
];

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Best Client Document Collection Tools for Bookkeepers (2026)",
  itemListOrder: "https://schema.org/ItemListOrderAscending",
  numberOfItems: TOOLS.length,
  itemListElement: TOOLS.map((t) => ({
    "@type": "ListItem",
    position: t.rank,
    name: t.name,
    url: t.ours ? SITE : t.url,
  })),
};

export default function BestToolsRoundupPage() {
  return (
    <main>
      <JsonLd data={itemListSchema} />
      <SiteNav />

      <section className="mx-auto max-w-4xl px-6 sm:px-8 pb-12 pt-8 lg:pt-14">
        <Reveal>
          <p className="kicker">Roundup</p>
          <h1 className="mt-5 font-editorial text-[clamp(34px,4.8vw,58px)] font-medium leading-[1.06] tracking-[-0.01em] text-site-ink">
            Best client document collection tools for bookkeepers
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-site-secondary">
            The tools bookkeepers actually use to collect what is blocking the month-end
            close, ranked for that job. We rated fit for bookkeeping, pricing, the client
            experience, and whether answers make it back into the books. RuledOff is our
            product, and we say plainly where another tool fits you better. Pricing is
            current as of July 2026.
          </p>
        </Reveal>
      </section>

      <section className="border-t border-site-border bg-site-paper">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 py-16">
          <div className="flex flex-col gap-5">
            {TOOLS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.05}>
                <div className="rounded-[12px] border border-site-border bg-site-white p-6 sm:p-7">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-brand text-[16px] font-bold text-white">
                      {t.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h2 className="font-editorial text-[22px] font-medium tracking-[-0.01em] text-site-ink">
                          {t.name}
                        </h2>
                        {t.ours && (
                          <span className="rounded-full bg-brass/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-brass">
                            Our product
                          </span>
                        )}
                      </div>
                      <p className="num mt-1 text-[13px] text-site-secondary">
                        {t.price} &nbsp;&middot;&nbsp; Best for: {t.bestFor}
                      </p>
                      <p className="mt-3 text-[15px] leading-relaxed text-site-secondary">
                        {t.summary}
                      </p>
                      <p className="mt-2 text-[14px] leading-relaxed text-site-secondary">
                        <span className="font-semibold text-site-ink">The honest catch: </span>
                        {t.honest}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        {t.ours ? (
                          <Button href="/signup">Start free for 14 days</Button>
                        ) : null}
                        {t.internal && (
                          <Link href={t.internal} className="text-[14px] font-semibold text-brand">
                            Full comparison
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-site-border bg-site-bg">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 py-16">
          <Reveal>
            <p className="kicker">How to choose</p>
            <h2 className="mt-4 font-editorial text-[clamp(24px,3.4vw,38px)] font-medium tracking-[-0.01em] text-site-ink">
              Pick for the job in front of you.
            </h2>
            <div className="guide mt-6 flex flex-col gap-4">
              <ul>
                <li>Only ever chasing uncategorized transactions? Uncat is the cheapest start.</li>
                <li>Collecting documents well beyond bookkeeping? Content Snare is the most flexible.</li>
                <li>Want a full practice-management suite? Client Hub does more than collection.</li>
                <li>Want the whole close collected and posted back, flat for any number of clients? That is what we built RuledOff for.</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
