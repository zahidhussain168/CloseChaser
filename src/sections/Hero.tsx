"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { Button } from "@/components/site/Button";
import { MonoLabel } from "@/components/site/MonoLabel";
import { SiteNav } from "@/components/site/SiteNav";

const INK = "#111315";
const GREEN = "#0E8A5F";
const SECONDARY = "#6F6E69";
const RED = "#B94B3D";

type Item = {
  label: string;
  detail: string;
  resolveAt: [number, number] | null;
};

// The hero hints at resolution: the first two items tick off as you scroll in,
// the rest stay open. The full "Ruled Off" payoff is reserved for the finale.
const ITEMS: Item[] = [
  { label: "Chase March bank statement", detail: "MARCH", resolveAt: [0.12, 0.34] },
  { label: "Categorize transactions", detail: "19", resolveAt: [0.42, 0.64] },
  { label: "Missing W-9 for Bright Design", detail: "1099", resolveAt: null },
  { label: "Upload April receipts", detail: "8 LEFT", resolveAt: null },
  { label: "Reconcile the bank feed", detail: "APR", resolveAt: null },
  { label: "Confirm the payroll journal", detail: "$14,200", resolveAt: null },
];

function ChecklistRow({
  label,
  detail,
  resolveAt,
  progress,
  reduced,
}: Item & { progress: MotionValue<number>; reduced: boolean }) {
  const resolvable = resolveAt !== null;
  const t = useTransform(
    progress,
    resolveAt ?? [0, 1],
    resolvable ? [0, 1] : [0, 0],
    { clamp: true },
  );
  const labelOpacity = useTransform(t, [0, 1], [1, 0.5]);
  const detailColor = useTransform(t, [0, 1], [SECONDARY, GREEN]);
  // Keep the pen tick fully hidden until it starts drawing (no zero-length dot).
  const checkOpacity = useTransform(t, [0, 0.04], [0, 1]);
  const st = reduced && resolvable; // static resolved end state

  return (
    <li className="grid grid-cols-[1.75rem_1fr_auto] items-center gap-3 border-b border-site-border/70 py-[15px] last:border-b-0">
      <span
        className="relative flex h-[26px] w-[26px] items-center justify-center rounded-[5px] border"
        style={{ borderColor: st ? GREEN : "#D9D4CA" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <motion.path
            d="M5 12.5 10 17.5 19 6.5"
            stroke={GREEN}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            style={{ pathLength: st ? 1 : t, opacity: st ? 1 : checkOpacity }}
          />
        </svg>
      </span>

      <span className="relative min-w-0">
        <motion.span
          className="block truncate text-[15px] text-site-ink"
          style={{ opacity: st ? 0.5 : labelOpacity }}
        >
          {label}
        </motion.span>
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-1/2 h-px w-full origin-left"
          style={{ background: "rgba(17,19,21,0.5)", scaleX: st ? 1 : t }}
        />
      </span>

      <motion.span
        className="font-mono text-[11px] tabular-nums tracking-wide"
        style={{ color: st ? GREEN : detailColor }}
      >
        {detail}
      </motion.span>
    </li>
  );
}

function ChecklistCard({
  progress,
  reduced,
}: {
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const openCount = useTransform(progress, [0, 0.34, 0.64], [6, 5, 4], {
    clamp: true,
  });
  const openText = useTransform(openCount, (v) => `${Math.round(v)} open`);

  return (
    <div
      className="w-full rounded-[8px] border border-site-border bg-site-white p-6 sm:p-8"
      style={{
        boxShadow:
          "0 1px 0 rgba(17,19,21,0.03), 0 28px 50px -30px rgba(17,19,21,0.22)",
      }}
    >
      <div className="flex items-baseline justify-between border-b border-site-border pb-4">
        <span className="font-geist text-[11px] uppercase tracking-[0.2em] text-site-secondary">
          April close
        </span>
        <span className="font-mono text-xs" style={{ color: RED }}>
          {reduced ? "4 open" : <motion.span>{openText}</motion.span>}
        </span>
      </div>
      <ul className="mt-1">
        {ITEMS.map((it) => (
          <ChecklistRow key={it.label} {...it} progress={progress} reduced={reduced} />
        ))}
      </ul>
    </div>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const rawReduced = useReducedMotion();
  // Defer the reduced-motion branch until after mount so the first client render
  // matches the server (no hydration mismatch); then jump to the end state.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduced = mounted && !!rawReduced;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  return (
    <section ref={ref} className="relative bg-site-bg">
      <SiteNav />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16 lg:pb-32 lg:pt-14">
        <div>
          <MonoLabel>For solo bookkeepers</MonoLabel>
          <h1 className="mt-5 font-editorial text-[clamp(40px,5.4vw,72px)] font-medium leading-[1.04] tracking-[-0.01em] text-site-ink">
            Stop chasing clients. Close the month faster.
          </h1>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-site-secondary">
            RuledOff collects everything blocking your month-end close and follows
            up with your client for you, automatically, until every item is done.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Button href="/signup">Start free</Button>
            <a
              href="#how"
              className="text-sm text-site-secondary underline-offset-4 transition-colors hover:text-site-ink hover:underline"
            >
              See how it works
            </a>
          </div>
        </div>

        <div className="flex items-center">
          <ChecklistCard progress={scrollYProgress} reduced={reduced} />
        </div>
      </div>
    </section>
  );
}
