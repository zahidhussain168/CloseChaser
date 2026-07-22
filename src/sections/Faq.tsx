"use client";

import { Plus } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { FAQ_ITEMS } from "@/lib/seo";

/**
 * Common questions, as native details/summary so it works without JavaScript
 * and stays accessible. The same FAQ_ITEMS feed the FAQPage structured data.
 */
export function Faq() {
  return (
    <section id="faq" className="section-y">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">Questions, answered</p>
          <h2 className="t-h2 mt-3 font-display text-text">Everything you might be wondering.</h2>
        </Reveal>

        <div className="mt-8 flex flex-col gap-3 sm:mt-10">
          {FAQ_ITEMS.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.04}>
              <details className="faq-item sheet group rounded-2xl px-5 py-4 sm:px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="text-[15.5px] font-bold text-text sm:text-[16.5px]">
                    {item.q}
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand transition-transform duration-200 group-open:rotate-45 dark:bg-brand-tint">
                    <Plus size={17} />
                  </span>
                </summary>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
