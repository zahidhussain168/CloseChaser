import { Reveal } from "@/components/site/Reveal";

export type Testimonial = { quote: string; name: string; firm: string };

/**
 * A social-proof strip meant to sit near a CTA. It is empty-state-ready: with no
 * real testimonials it renders nothing at all, so the page never ships fabricated
 * quotes. When genuine quotes exist, pass them in and it becomes a quote row.
 *
 * Wire real quotes here (or lift to a data source) when they arrive:
 */
const TESTIMONIALS: Testimonial[] = [];

export function ProofStrip({ quotes = TESTIMONIALS }: { quotes?: Testimonial[] }) {
  if (!quotes.length) return null;

  return (
    <section className="border-y border-line bg-surface-2">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.slice(0, 3).map((t) => (
            <Reveal key={t.name}>
              <figure className="sheet flex h-full flex-col justify-between gap-4 p-6">
                <blockquote className="text-[15px] leading-relaxed text-text">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="text-[13px]">
                  <span className="font-semibold text-text">{t.name}</span>
                  <span className="text-muted"> · {t.firm}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
