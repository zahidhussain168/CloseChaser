import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";

const DESC =
  "Practical guides for bookkeepers on closing the month, collecting 1099s, and catching up behind books, plus how RuledOff keeps client data secure.";

export const metadata: Metadata = {
  title: "Resources for bookkeepers",
  description: DESC,
  alternates: { canonical: "/resources" },
  openGraph: { title: "Resources for bookkeepers", description: DESC, url: "/resources" },
};

const GUIDES = [
  {
    href: "/resources/month-end-close-checklist",
    title: "The month-end close checklist",
    blurb: "The repeatable list that gets every close over the line, including the part you can hand off.",
  },
  {
    href: "/resources/collect-w9-and-1099",
    title: "Collect W-9s and 1099s without the scramble",
    blurb: "Who needs a 1099, what to gather, and how to collect it before the January deadline.",
  },
  {
    href: "/resources/catch-up-bookkeeping",
    title: "Catch-up bookkeeping, without the back-and-forth",
    blurb: "How to gather months of documents in order and start a set of books clean.",
  },
];

export default function ResourcesHubPage() {
  return (
    <main>
      <SiteNav />

      <section className="mx-auto max-w-5xl px-6 sm:px-8 pb-12 pt-8 lg:pt-14">
        <Reveal className="max-w-2xl">
          <p className="kicker">Resources</p>
          <h1 className="mt-5 font-editorial text-[clamp(36px,5vw,60px)] font-medium leading-[1.06] tracking-[-0.01em] text-site-ink">
            Guides for getting the books closed.
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-site-secondary">
            Practical, no-fluff guides on the parts of the job that depend on someone
            else sending something. Written for solo bookkeepers.
          </p>
        </Reveal>
      </section>

      <section className="border-t border-site-border bg-site-paper">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 py-16">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDES.map((g, i) => (
              <Reveal key={g.href} delay={i * 0.06}>
                <Link
                  href={g.href}
                  className="flex h-full flex-col rounded-[12px] border border-site-border bg-site-white p-6 transition-colors hover:border-brass"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-brass-ink">
                    Guide
                  </span>
                  <h2 className="mt-3 font-editorial text-[20px] font-medium leading-[1.2] tracking-[-0.01em] text-site-ink">
                    {g.title}
                  </h2>
                  <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-site-secondary">
                    {g.blurb}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand">
                    Read the guide
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10">
            <div className="rounded-[12px] border border-site-border bg-site-white p-6 sm:flex sm:items-center sm:justify-between">
              <div>
                <h2 className="font-editorial text-[20px] font-medium tracking-[-0.01em] text-site-ink">
                  How RuledOff keeps client data safe
                </h2>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-site-secondary">
                  No client logins, private encrypted storage, and links that expire.
                </p>
              </div>
              <Link
                href="/security"
                className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand sm:mt-0"
              >
                See our security
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
