"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/animations/motion";
import { Button } from "@/components/site/Button";

const INK = "#111315";
const GREEN = "#0E8A5F";

// The two items the hero left open, now closed for good.
const LEFTOVERS = ["Reconcile the bank feed", "Confirm the payroll journal"];

function Tick({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5 10 17.5 19 6.5"
        stroke={GREEN}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const HEADING =
  "font-editorial text-[clamp(52px,9vw,104px)] font-medium leading-[0.95] tracking-[-0.02em] text-site-ink";
const RULE_WRAP = "mx-auto mt-7 w-[min(320px,66vw)] space-y-[5px]";
const RULE = "h-[2px] w-full origin-left rounded-full";
const STAMP =
  "font-mono text-[13px] uppercase tracking-[0.14em] text-site-secondary";

function Caption() {
  return (
    <>
      <Tick size={18} />
      <span className={STAMP}>April 2026 closed</span>
    </>
  );
}

function Cta() {
  return (
    <>
      <Button href="/signup">Close your next month with RuledOff</Button>
      <span className="text-[13px] text-site-secondary">
        Flat $29 a month. Unlimited clients.
      </span>
    </>
  );
}

/**
 * prefers-reduced-motion: the finished mark, rendered outright. No motion
 * components at all, so nothing can be left stranded at an initial opacity.
 */
function StaticMark() {
  return (
    <div className="text-center">
      <h2 className={HEADING}>Ruled off.</h2>
      <div className={RULE_WRAP}>
        <div className={RULE} style={{ background: INK }} />
        <div className={RULE} style={{ background: INK }} />
      </div>
      <div className="mt-7 flex items-center justify-center gap-2">
        <Caption />
      </div>
      <div className="mt-12 flex flex-col items-center gap-3">
        <Cta />
      </div>
    </div>
  );
}

/** The ceremony: the last items clear, then the double-rule draws itself. */
function AnimatedMark() {
  const viewport = { once: true, amount: 0.6 } as const;
  return (
    <>
      <motion.div
        className="absolute flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: [0, 1, 1, 0] }}
        viewport={viewport}
        transition={{ duration: 1.5, times: [0, 0.2, 0.55, 1], ease: EASE }}
      >
        {LEFTOVERS.map((t) => (
          <div key={t} className="flex items-center gap-3 text-[15px]">
            <Tick />
            <span className="text-site-secondary line-through">{t}</span>
          </div>
        ))}
      </motion.div>

      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.5, ease: EASE, delay: 1.1 }}
      >
        <h2 className={HEADING}>Ruled off.</h2>

        <div className={RULE_WRAP}>
          <motion.div
            className={RULE}
            style={{ background: INK }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={viewport}
            transition={{ duration: 0.38, ease: EASE, delay: 1.35 }}
          />
          <motion.div
            className={RULE}
            style={{ background: INK }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={viewport}
            transition={{ duration: 0.38, ease: EASE, delay: 1.46 }}
          />
        </div>

        <motion.div
          className="mt-7 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewport}
          transition={{ duration: 0.4, ease: EASE, delay: 1.75 }}
        >
          <Caption />
        </motion.div>

        <motion.div
          className="mt-12 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewport}
          transition={{ duration: 0.4, ease: EASE, delay: 2.0 }}
        >
          <Cta />
        </motion.div>
      </motion.div>
    </>
  );
}

export function Finale() {
  const rawReduced = useReducedMotion();
  // Defer the branch until after mount so the first client render matches the
  // server, then swap to the static end state.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduced = mounted && !!rawReduced;

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center border-t border-site-border bg-site-bg px-6 py-24">
      <div className="relative flex w-full max-w-xl items-center justify-center">
        {reduced ? <StaticMark /> : <AnimatedMark />}
      </div>
    </section>
  );
}
