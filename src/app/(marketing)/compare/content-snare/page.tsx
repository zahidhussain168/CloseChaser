import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/site/Button";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { JsonLd } from "@/components/site/JsonLd";

const DESC =
  "Content Snare is great general document collection. RuledOff is built for the bookkeeping close, with QuickBooks writeback and a flat $39 for unlimited clients. Compared for 2026.";

export const metadata: Metadata = {
  title: { absolute: "RuledOff vs Content Snare: Built for the Close (2026)" },
  description: DESC,
  alternates: { canonical: "/compare/content-snare" },
  openGraph: {
    title: "RuledOff vs Content Snare",
    description: DESC,
    url: "/compare/content-snare",
  },
};

const SITE = "https://ruledoff.vercel.app";

// Pricing and features are current as of July 2026, from each product's public site.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Compare", item: `${SITE}/compare` },
        { "@type": "ListItem", position: 3, name: "RuledOff vs Content Snare", item: `${SITE}/compare/content-snare` },
      ],
    },
    {
      "@type": "SoftwareApplication",
      name: "RuledOff",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE,
      offers: { "@type": "Offer", price: "39.00", priceCurrency: "USD", category: "subscription" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Content Snare",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://contentsnare.com/",
      offers: { "@type": "Offer", price: "35.00", priceCurrency: "USD", category: "subscription" },
    },
  ],
};

type Row = { feature: string; ruledoff: string; other: string };

const ROWS: Row[] = [
  { feature: "Pricing", ruledoff: "$39/mo flat, unlimited clients", other: "From $35/mo billed annually, per account" },
  { feature: "Client limit", ruledoff: "Unlimited", other: "Capped on lower plans" },
  { feature: "Built for bookkeeping", ruledoff: "Yes", other: "No, general document collection" },
  { feature: "Uncategorized transactions", ruledoff: "Yes, pulled from QuickBooks", other: "No" },
  { feature: "QuickBooks writeback", ruledoff: "Yes, memo and attachment", other: "No" },
  { feature: "Questionnaires", ruledoff: "Yes", other: "Yes, general forms" },
  { feature: "No client login", ruledoff: "Yes, one magic link", other: "Link based, client portal" },
  { feature: "Automated reminders", ruledoff: "Yes, escalating then auto-stops", other: "Yes, unlimited" },
  { feature: "Best for", ruledoff: "The bookkeeping month-end close", other: "Document collection across industries" },
];

function Cell({ value }: { value: string }) {
  const isYes = value === "Yes" || value.startsWith("Yes,") || value.startsWith("Yes ");
  const isNo = value === "No" || value.startsWith("No,") || value.startsWith("No ");
  return (
    <span className={"inline-flex items-start gap-1.5 " + (isNo ? "text-site-secondary" : "text-site-ink")}>
      {isYes && (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-[3px] shrink-0">
          <path d="M5 12.5 10 17.5 19 6.5" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {value}
    </span>
  );
}

export default function CompareContentSnarePage() {
  return (
    <main>
      <JsonLd data={structuredData} />
      <SiteNav />

      <section className="mx-auto max-w-4xl px-6 sm:px-8 pb-16 pt-8 lg:pt-14">
        <Reveal>
          <p className="kicker">Compare</p>
          <h1 className="mt-5 font-editorial text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-[-0.01em] text-site-ink">
            RuledOff vs Content Snare
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-site-secondary">
            Content Snare is a polished, flexible way to collect documents and form
            answers from clients in any industry. RuledOff is narrower on purpose: it is
            built for the bookkeeping close, so it pulls uncategorized transactions from
            QuickBooks, posts the answers back, and stays a flat $39 for unlimited
            clients.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/signup">Start free for 14 days</Button>
            <Button href="/pricing" variant="secondary">
              See pricing
            </Button>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-site-border bg-site-paper">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 py-20">
          <Reveal>
            <p className="kicker">At a glance</p>
            <h2 className="mt-5 font-editorial text-[clamp(26px,3.6vw,42px)] font-medium leading-[1.1] tracking-[-0.01em] text-site-ink">
              Feature by feature.
            </h2>
          </Reveal>
          <Reveal className="mt-10">
            <div className="overflow-x-auto rounded-[12px] border border-site-border bg-site-white">
              <table className="w-full min-w-[560px] border-collapse text-left text-[14.5px]">
                <thead>
                  <tr className="border-b border-site-border">
                    <th className="px-5 py-4 font-semibold text-site-secondary">Feature</th>
                    <th className="px-5 py-4 font-bold text-site-ink">RuledOff</th>
                    <th className="px-5 py-4 font-semibold text-site-secondary">Content Snare</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r, i) => (
                    <tr key={r.feature} className={i % 2 === 1 ? "bg-site-paper/60" : undefined}>
                      <td className="px-5 py-3.5 font-medium text-site-ink">{r.feature}</td>
                      <td className="px-5 py-3.5"><Cell value={r.ruledoff} /></td>
                      <td className="px-5 py-3.5"><Cell value={r.other} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-site-secondary">
            As of July 2026. Check contentsnare.com for their latest.
          </p>
        </div>
      </section>

      <section className="border-t border-site-border bg-site-bg">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 py-20">
          <div className="flex flex-col gap-12">
            <Reveal>
              <h2 className="font-editorial text-[24px] font-medium tracking-[-0.01em] text-site-ink">
                Built for the close, not for everything
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-site-secondary">
                Content Snare serves accounting, legal, mortgage, and more, so it stays
                general on purpose. RuledOff only does one job. It knows what a month-end
                close needs, detects the uncategorized charges and Ask My Accountant
                entries in QuickBooks, and turns them into questions your client can
                answer on their phone.
              </p>
            </Reveal>

            <Reveal>
              <h2 className="font-editorial text-[24px] font-medium tracking-[-0.01em] text-site-ink">
                Flat and unlimited, versus tiered per account
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-site-secondary">
                Content Snare starts around $35 a month billed annually and steps up
                through Plus, Pro, and Custom tiers, with client limits on the lower
                plans. RuledOff is a single flat $39 a month for unlimited clients and
                unlimited closes, so a growing book never changes the bill.
              </p>
            </Reveal>

            <Reveal>
              <h2 className="font-editorial text-[24px] font-medium tracking-[-0.01em] text-site-ink">
                QuickBooks, both ways
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-site-secondary">
                This is the clearest line between the two. Content Snare collects files
                and form answers, but it does not connect to QuickBooks. RuledOff pulls
                the transactions that are blocking the close and writes the client's
                answer and receipt back into the books, so you are not rekeying anything.
              </p>
            </Reveal>

            <Reveal>
              <h2 className="font-editorial text-[24px] font-medium tracking-[-0.01em] text-site-ink">
                When Content Snare is the better pick
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-site-secondary">
                Honestly: if you collect documents well beyond bookkeeping, across
                different kinds of clients and request types, Content Snare's form
                builder is more flexible and its templates are strong. If your work is
                the books, RuledOff fits the close more tightly and costs less to run.
                See how RuledOff also compares to{" "}
                <Link href="/compare/uncat">Uncat</Link>, or read the{" "}
                <Link href="/compare/best-document-collection-tools">full roundup</Link>.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-site-border bg-site-paper">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 py-24 text-center">
          <Reveal>
            <h2 className="font-editorial text-[clamp(30px,4.4vw,52px)] font-medium leading-[1.06] tracking-[-0.01em] text-site-ink">
              Run one close on us.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-site-secondary">
              Fourteen days, every feature, no card. Collect the whole close on one flat plan.
            </p>
            <div className="mt-9 flex justify-center">
              <Button href="/signup">Start your 14-day trial</Button>
            </div>
            <p className="mt-8 text-[13px] text-site-secondary">
              RuledOff is our product. We have represented Content Snare from its public
              site as of July 2026, and aimed to be fair. Check contentsnare.com for the latest.
            </p>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
