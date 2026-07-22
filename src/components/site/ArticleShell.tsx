import type { ReactNode } from "react";
import { Button } from "./Button";
import { Reveal } from "./Reveal";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";

/** Shared shell for long-form Resources articles: nav, hero, prose body, CTA. */
export function ArticleShell({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main>
      <SiteNav />

      <article className="mx-auto max-w-3xl px-6 sm:px-8 pb-4 pt-8 lg:pt-14">
        <Reveal>
          <p className="kicker">{kicker}</p>
          <h1 className="mt-5 font-editorial text-[clamp(32px,4.6vw,52px)] font-medium leading-[1.08] tracking-[-0.01em] text-site-ink">
            {title}
          </h1>
          <p className="mt-6 text-[18px] leading-relaxed text-site-secondary">{intro}</p>
        </Reveal>

        <Reveal className="mt-10">
          <div className="guide flex flex-col gap-7">{children}</div>
        </Reveal>
      </article>

      <section className="mt-16 border-t border-site-border bg-site-paper">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 py-16 text-center">
          <h2 className="font-editorial text-[clamp(24px,3.4vw,36px)] font-medium tracking-[-0.01em] text-site-ink">
            Let RuledOff do the chasing.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-site-secondary">
            Collect every document, receipt, and answer on one no-login link, on a flat plan.
          </p>
          <div className="mt-7 flex justify-center">
            <Button href="/signup">Start free for 14 days</Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
