"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/site/Button";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The climax: a dark, near-empty band where the product's namesake mark, the
 * accountant's double-rule, draws itself. This is the one full "ruled off"
 * payoff on the page. Motion is whileInView; the marketing layout's
 * MotionProvider snaps it to the end state under prefers-reduced-motion.
 */
export function Finale() {
  const vp = { once: true, amount: 0.5 } as const;
  const scope = useRef<HTMLElement>(null);

  // The double-rule draws itself as you scroll into the finale: each line's
  // scaleX is scrubbed 0 -> 1 across the approach, the second trailing the
  // first, so the mark inks in under your scroll rather than on a timer.
  // Disabled entirely under prefers-reduced-motion, where the lines sit drawn.
  useGSAP(
    () => {
      gsap.fromTo(
        "[data-rule]",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          stagger: 0.18,
          scrollTrigger: {
            trigger: "[data-rule-wrap]",
            start: "top 85%",
            end: "top 42%",
            scrub: 0.6,
          },
        },
      );
      ScrollTrigger.refresh();
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      className="relative overflow-hidden bg-[#05070c]/80 px-5 sm:px-8 py-32 text-white sm:py-40"
    >
      {/* faint brass glow behind the mark, kept low so the section stays quiet */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass/10 blur-[150px]"
      />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        <motion.p
          className="mb-8 font-mono text-[12px] uppercase tracking-[0.22em] text-slate-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={vp}
          transition={{ duration: 0.4, ease: EASE }}
        >
          Every item answered
        </motion.p>

        <motion.h2
          className="font-display text-[clamp(64px,15vw,124px)] font-extrabold leading-[0.92] tracking-[-0.03em] text-white"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
        >
          Ruled off.
        </motion.h2>

        {/* The double-rule, scrubbed left-to-right by GSAP as the section nears */}
        <div data-rule-wrap className="mt-9 w-[min(380px,78vw)] space-y-[7px]">
          <div
            data-rule
            className="h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-brass to-emerald-400"
          />
          <div
            data-rule
            className="h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-brass to-emerald-400"
          />
        </div>

        <motion.div
          className="mt-9 flex items-center gap-2 text-emerald-300"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={vp}
          transition={{ duration: 0.4, ease: EASE, delay: 0.95 }}
        >
          <Check size={18} strokeWidth={2.4} />
          <span className="font-mono text-[13px] uppercase tracking-[0.16em]">
            Your books are closed
          </span>
        </motion.div>

        <motion.p
          className="mt-10 max-w-md text-[17px] leading-relaxed text-slate-300"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={vp}
          transition={{ duration: 0.4, ease: EASE, delay: 1.15 }}
        >
          That is the feeling RuledOff is built for. The chasing runs itself, and
          the month closes on time.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={vp}
          transition={{ duration: 0.4, ease: EASE, delay: 1.3 }}
        >
          <Button href="/signup" size="lg">
            Close your first month <ArrowRight size={18} />
          </Button>
          <span className="text-[13px] text-slate-400">
            Free for 14 days. No card required.
          </span>
        </motion.div>
      </div>
    </section>
  );
}
