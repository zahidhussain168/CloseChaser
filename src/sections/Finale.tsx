"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/site/Button";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The climax: a dark, near-empty band where the product's namesake mark, the
 * accountant's double-rule, draws itself. This is the one full "ruled off"
 * payoff on the page. Motion is whileInView; the marketing layout's
 * MotionProvider snaps it to the end state under prefers-reduced-motion.
 */
export function Finale() {
  const vp = { once: true, amount: 0.5 } as const;

  return (
    <section className="relative overflow-hidden bg-[#0B1120] px-5 py-28 text-white sm:py-36">
      {/* soft brand glow behind the mark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-[130px]"
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

        {/* The double-rule, drawing left to right */}
        <div className="mt-9 w-[min(380px,78vw)] space-y-[7px]">
          <motion.div
            className="h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-brand to-emerald-400"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={vp}
            transition={{ duration: 0.42, ease: EASE, delay: 0.55 }}
          />
          <motion.div
            className="h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-brand to-emerald-400"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={vp}
            transition={{ duration: 0.42, ease: EASE, delay: 0.66 }}
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
