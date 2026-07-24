import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/site/Button";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { JsonLd } from "@/components/site/JsonLd";

const DESC =
  "Double (formerly Keeper) is a deep close-management and client-communication suite priced per client. RuledOff is a single-purpose, flat-priced chaser for the month-end close. Compared honestly for 2026.";

export const metadata: Metadata = {
  title: { absolute: "RuledOff vs Double (formerly Keeper): Flat vs Per-Client (2026)" },
  description: DESC,
  alternates: { canonical: "/compare/double" },
  openGraph: {
    title: "RuledOff vs Double (formerly Keeper)",
    description: DESC,
    url: "/compare/double",
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
        { "@type": "ListItem", position: 3, name: "RuledOff vs Double", item: `${SITE}/compare/double` },
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
      name: "Double",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://www.trykeeper.com/",
      offers: { "@type": "Offer", price: "10.00", priceCurrency: "USD", category: "subscription" },
    },
  ],
};

type Row = { feature: string; ruledoff: string; other: string };

const ROWS: Row[] = [
  { feature: "Pricing", ruledoff: "$0, $39 or $69/mo flat, unlimited clients", other: "Roughly $10 to $50 per client per month" },
  { feature: "Client limit", ruledoff: "Unlimited on every plan, including free", other: "You pay for each client" },
  { feature: "Depth of close review", ruledoff: "Focused: what is blocking the close", other: "Deep: full close review, reporting, coding checks" },
  { feature: "AI suite", ruledoff: "AI Close Analyst (Scale)", other: "Broad AI review and clean-up assistant" },
  { feature: "Client chasing", ruledoff: "Core: no-login link, auto-escalating", other: "Yes, plus client requests and portal" },
  { feature: "Predicted close date", ruledoff: "Yes, per client (Close Forecast)", other: "Not the focus" },
  { feature: "Reporting and analytics", ruledoff: "Light, close-focused", other: "Extensive, firm-wide" },
  { feature: "Best for", ruledoff: "A solo who wants the close to close", other: "Growing firms that live in one platform" },
];

function Cell({ value }: { value: string }) {
  return <span className="text-site-ink">{value}</span>;
}

export default function CompareDoublePage() {
  return (
    <main>
      <JsonLd data={structuredData} />
      <SiteNav />

      <section className="mx-auto max-w-4xl px-6 sm:px-8 pb-16 pt-8 lg:pt-14">
        <Reveal>
          <p className="kicker">Compare</p>
          <h1 className="mt-5 font-editorial text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-[-0.01em] text-site-ink">
            RuledOff vs Double
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-site-secondary">
            Double, formerly Keeper, is a genuinely deep close-management platform: a full
            month-end review, coding and reconciliation checks, reporting, an AI clean-up
            suite, and client communication, trusted by thousands of firms. RuledOff does one
            slice of that, the chasing, and prices it flat instead of per client. Here is the
            honest picture of when each one fits.
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
                    <th className="px-5 py-4 font-semibold text-site-secondary">Double</th>
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
            As of July 2026. Check trykeeper.com for their latest.
          </p>
        </div>
      </section>

      <section className="border-t border-site-border bg-site-bg">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 py-20">
          <div className="flex flex-col gap-12">
            <Reveal>
              <h2 className="font-editorial text-[24px] font-medium tracking-[-0.01em] text-site-ink">
                Double does far more. That is the point of it
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-site-secondary">
                We will not pretend RuledOff matches Double on depth. Double reviews the whole
                set of books, flags coding and reconciliation issues, builds client reports, and
                layers an AI clean-up suite on top, which is why so many growing firms run their
                practice inside it. If you want one platform that manages the entire close and
                the client relationship, Double is a strong choice and RuledOff is not trying to
                replace it.
              </p>
            </Reveal>

            <Reveal>
              <h2 className="font-editorial text-[24px] font-medium tracking-[-0.01em] text-site-ink">
                Flat, versus per client
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-site-secondary">
                The clearest difference is the bill. Double is priced per client per month, which
                is fair for the depth but grows with your book. RuledOff is a single flat rate,
                $39 for Pro or $69 for Scale, for unlimited clients. For a solo taking on more
                clients, that difference compounds every month, and the price never changes as
                you grow.
              </p>
            </Reveal>

            <Reveal>
              <h2 className="font-editorial text-[24px] font-medium tracking-[-0.01em] text-site-ink">
                One job, done tightly: getting the close to close
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-site-secondary">
                RuledOff is single-purpose. It detects what is blocking the close, chases the
                client on a no-login link until each item is answered, and on the Scale plan it
                predicts each client's finish date so you know who will make you late before it
                happens. No competitor gives a solo a predicted close date, and there is no suite
                to learn to get it.
              </p>
            </Reveal>

            <Reveal>
              <h2 className="font-editorial text-[24px] font-medium tracking-[-0.01em] text-site-ink">
                When Double is the better pick
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-site-secondary">
                Honestly: if you run a growing firm, want deep close review and reporting in one
                place, and the per-client price fits your margins, Double is the more complete
                tool. If you are a solo who mostly needs the chasing to run itself on a flat
                bill, RuledOff fits tighter and costs less. See how RuledOff also compares to{" "}
                <Link href="/compare/uncat">Uncat</Link> and{" "}
                <Link href="/compare/content-snare">Content Snare</Link>.
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
              Fourteen days, every feature, no card. Flat pricing, unlimited clients.
            </p>
            <div className="mt-9 flex justify-center">
              <Button href="/signup">Start your 14-day trial</Button>
            </div>
            <p className="mt-8 text-[13px] text-site-secondary">
              RuledOff is our product. We have represented Double (formerly Keeper) from its
              public site as of July 2026, and aimed to be fair. Check trykeeper.com for the latest.
            </p>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
