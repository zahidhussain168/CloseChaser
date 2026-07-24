import { Reveal } from "@/components/site/Reveal";

/**
 * Founder-story section. Left-aligned editorial layout, light ivory ground.
 *
 * PLACEHOLDER COPY: the words below are honest, generic positioning with no
 * fabricated names, quotes, or claims. Replace with the real founder's story,
 * name, and photo when ready (swap the initials tile for an <Image>).
 */
export function FounderStory() {
  return (
    <section className="section-y bg-surface-2">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <Reveal>
            <div className="flex items-center gap-4">
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-[22px] font-bold text-white"
                style={{ background: "var(--brand)" }}
                aria-hidden="true"
              >
                RO
              </span>
              <div>
                <p className="kicker">Why we built it</p>
                <p className="mt-1 text-[14px] text-muted">A note from the maker</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 className="t-h2 font-display text-text">A bookkeeper built this, not a tech company.</h2>
            <div className="mt-5 flex max-w-xl flex-col gap-4 text-[16px] leading-relaxed text-muted">
              <p>
                RuledOff started with one solo bookkeeper&apos;s least favorite week of the month:
                the one spent chasing the same clients for the same documents, again. Every tool
                that promised to fix it asked the client to make an account, and every client quietly
                refused.
              </p>
              <p>
                So the fix had to start from the client&apos;s side. One link, no login, nothing to
                download. Build the chasing in, let it stop the moment the work is done, and give the
                bookkeeper their week back.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
