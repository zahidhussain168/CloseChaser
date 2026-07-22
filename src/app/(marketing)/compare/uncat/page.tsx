import type { Metadata } from "next";
import { Button } from "@/components/site/Button";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { JsonLd } from "@/components/site/JsonLd";

const DESC =
  "Uncat charges per client and only handles uncategorized transactions. RuledOff is $39 flat for unlimited clients and collects documents, receipts, and answers too. Compared for 2026.";

export const metadata: Metadata = {
  title: { absolute: "RuledOff vs Uncat: Flat Pricing vs Per-Client (2026)" },
  description: DESC,
  alternates: { canonical: "/compare/uncat" },
  openGraph: {
    title: "RuledOff vs Uncat",
    description: DESC,
    url: "/compare/uncat",
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
        { "@type": "ListItem", position: 2, name: "RuledOff vs Uncat", item: `${SITE}/compare/uncat` },
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
      name: "Uncat",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://www.uncat.com/",
      offers: { "@type": "Offer", price: "9.00", priceCurrency: "USD", category: "subscription" },
    },
  ],
};

type Row = { feature: string; ruledoff: string; uncat: string };

const ROWS: Row[] = [
  { feature: "Pricing", ruledoff: "$39/mo flat, unlimited clients", uncat: "$9/mo per client" },
  { feature: "Cost at 10 clients", ruledoff: "$39", uncat: "$90" },
  { feature: "Client login required", ruledoff: "No, one magic link", uncat: "No, link based" },
  { feature: "Uncategorized transactions", ruledoff: "Yes", uncat: "Yes" },
  { feature: "Document and statement requests", ruledoff: "Yes", uncat: "Receipts only" },
  { feature: "Questionnaires (multi-question intake)", ruledoff: "Yes", uncat: "No" },
  { feature: "QuickBooks Online writeback", ruledoff: "Yes, memo and attachment", uncat: "Yes, sync" },
  { feature: "Xero", ruledoff: "On the roadmap", uncat: "Yes" },
  { feature: "Automated escalating reminders", ruledoff: "Yes, day 2 / 5 / 9 then weekly", uncat: "Reminders" },
  { feature: "Starter packs (1099, onboarding)", ruledoff: "Yes", uncat: "No" },
];

const PRICE_MATH = [
  { clients: "1 client", ruledoff: "$39", uncat: "$9" },
  { clients: "3 clients", ruledoff: "$39", uncat: "$27" },
  { clients: "5 clients", ruledoff: "$39", uncat: "$45" },
  { clients: "10 clients", ruledoff: "$39", uncat: "$90" },
  { clients: "20 clients", ruledoff: "$39", uncat: "$180" },
];

function Cell({ value }: { value: string }) {
  const isYes = value === "Yes" || value.startsWith("Yes,") || value.startsWith("Yes ");
  const isNo = value === "No" || value.startsWith("No,") || value.startsWith("No ");
  return (
    <span
      className={
        "inline-flex items-start gap-1.5 " +
        (isNo ? "text-site-secondary" : "text-site-ink")
      }
    >
      {isYes && (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-[3px] shrink-0">
          <path d="M5 12.5 10 17.5 19 6.5" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {value}
    </span>
  );
}

export default function CompareUncatPage() {
  return (
    <main>
      <JsonLd data={structuredData} />
      <SiteNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 sm:px-8 pb-16 pt-8 lg:pt-14">
        <Reveal>
          <p className="kicker">Compare</p>
          <h1 className="mt-5 font-editorial text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-[-0.01em] text-site-ink">
            RuledOff vs Uncat
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-site-secondary">
            Uncat is a clean, cheap way to clear uncategorized transactions, at $9 per client each
            month. RuledOff does that and the rest of the close, documents, receipts, and
            multi-question intake, for one flat $39 a month no matter how many clients you run. If
            you close more than about four clients a month, RuledOff costs less and replaces more
            tools.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/signup">Start free for 14 days</Button>
            <Button href="/pricing" variant="secondary">
              See pricing
            </Button>
          </div>
        </Reveal>
      </section>

      {/* At a glance table */}
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
              <table className="w-full min-w-[540px] border-collapse text-left text-[14.5px]">
                <thead>
                  <tr className="border-b border-site-border">
                    <th className="px-5 py-4 font-semibold text-site-secondary">Feature</th>
                    <th className="px-5 py-4 font-bold text-site-ink">RuledOff</th>
                    <th className="px-5 py-4 font-semibold text-site-secondary">Uncat</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r, i) => (
                    <tr
                      key={r.feature}
                      className={i % 2 === 1 ? "bg-site-paper/60" : undefined}
                    >
                      <td className="px-5 py-3.5 font-medium text-site-ink">{r.feature}</td>
                      <td className="px-5 py-3.5">
                        <Cell value={r.ruledoff} />
                      </td>
                      <td className="px-5 py-3.5">
                        <Cell value={r.uncat} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-site-secondary">
            As of July 2026. Check uncat.com for their latest.
          </p>
        </div>
      </section>

      {/* Pricing math */}
      <section className="border-t border-site-border bg-site-bg">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 py-20">
          <Reveal>
            <p className="kicker">The math</p>
            <h2 className="mt-5 max-w-2xl font-editorial text-[clamp(26px,3.6vw,42px)] font-medium leading-[1.1] tracking-[-0.01em] text-site-ink">
              Flat wins the moment you have a few clients.
            </h2>
            <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-site-secondary">
              Uncat is priced per client, so the bill grows with your book. RuledOff stays $39 no
              matter how many closes you run.
            </p>
          </Reveal>
          <Reveal className="mt-10">
            <div className="overflow-x-auto rounded-[12px] border border-site-border bg-site-white">
              <table className="w-full min-w-[420px] border-collapse text-left text-[15px]">
                <thead>
                  <tr className="border-b border-site-border">
                    <th className="px-5 py-4 font-semibold text-site-secondary">Clients</th>
                    <th className="px-5 py-4 font-bold text-site-ink">RuledOff</th>
                    <th className="px-5 py-4 font-semibold text-site-secondary">Uncat</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICE_MATH.map((r, i) => (
                    <tr key={r.clients} className={i % 2 === 1 ? "bg-site-paper/60" : undefined}>
                      <td className="px-5 py-3.5 font-medium text-site-ink">{r.clients}</td>
                      <td className="num px-5 py-3.5 font-semibold text-site-ink">{r.ruledoff}</td>
                      <td className="num px-5 py-3.5 text-site-secondary">{r.uncat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Prose sections */}
      <section className="border-t border-site-border bg-site-paper">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 py-20">
          <div className="flex flex-col gap-12">
            <Reveal>
              <h2 className="font-editorial text-[24px] font-medium tracking-[-0.01em] text-site-ink">
                One tool for the whole close, not just cleanup
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-site-secondary">
                Uncat is built around one job: getting clients to explain uncategorized transactions
                and attach a receipt. That job matters, and Uncat does it well. But a month-end close
                is more than that. You also need bank statements, a signed W-9, a straight answer to a
                question about a big charge. RuledOff collects all of it on the same link:
                transactions, documents, and questionnaires that ask several things at once.
              </p>
            </Reveal>

            <Reveal>
              <h2 className="font-editorial text-[24px] font-medium tracking-[-0.01em] text-site-ink">
                The same no-login client experience
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-site-secondary">
                Both tools spare your client a login, which is the right call. RuledOff sends one
                branded link. Your client opens it on their phone, answers what they can, snaps a
                photo of a receipt, and it saves as they go. Closing the tab loses nothing, and there
                is never an account to create.
              </p>
            </Reveal>

            <Reveal>
              <h2 className="font-editorial text-[24px] font-medium tracking-[-0.01em] text-site-ink">
                QuickBooks, both ways
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-site-secondary">
                Both pull from QuickBooks and post answers back. RuledOff writes the client's
                explanation into the transaction memo and attaches the uploaded receipt, so the
                answer lives where you need it. Uncat also supports Xero today, which RuledOff has on
                the roadmap.
              </p>
            </Reveal>

            <Reveal>
              <h2 className="font-editorial text-[24px] font-medium tracking-[-0.01em] text-site-ink">
                When Uncat is the better pick
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-site-secondary">
                To be fair: if you have one or two clients and only ever touch uncategorized
                transactions, Uncat's $9 entry is hard to beat, and its Xero support is live now. If
                that is you, start there. The moment you are running several closes, or you need
                documents and questionnaires as well, RuledOff does more for less.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="border-t border-site-border bg-site-bg">
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
              RuledOff is our product. We have represented Uncat from its public site as of July
              2026, and aimed to be fair. Check uncat.com for the latest.
            </p>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
