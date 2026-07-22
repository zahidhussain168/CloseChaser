import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";

/** Plain shell for legal pages: nav, title, updated date, prose, footer. */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main>
      <SiteNav />
      <article className="mx-auto max-w-3xl px-6 sm:px-8 pb-16 pt-8 lg:pt-14">
        <Reveal>
          <h1 className="font-editorial text-[clamp(32px,4.4vw,50px)] font-medium leading-[1.08] tracking-[-0.01em] text-site-ink">
            {title}
          </h1>
          <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.12em] text-site-secondary">
            Last updated {updated}
          </p>
        </Reveal>
        <Reveal className="mt-10">
          <div className="guide flex flex-col gap-6">{children}</div>
        </Reveal>
      </article>
      <SiteFooter />
    </main>
  );
}
