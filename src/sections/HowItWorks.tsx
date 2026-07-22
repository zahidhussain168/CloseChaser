"use client";

import { motion, type Variants } from "framer-motion";
import { Check } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

const EASE = [0.22, 1, 0.36, 1] as const;
const STEP = 0.34; // per-step beat: node -> text -> chip, offset by index

const STEPS = [
  {
    n: "1",
    title: "Connect your books",
    body: "Link QuickBooks or add manual requests. RuledOff detects the uncategorized charges and missing documents holding up the close.",
    chip: { label: "QuickBooks connected", tone: "success" as const },
  },
  {
    n: "2",
    title: "It chases your client",
    body: "One branded link goes out. Your client answers from their phone while RuledOff sends the reminders, escalating in tone, so you never have to.",
    chip: { label: "Reminder sent, day 5", tone: "warning" as const },
  },
  {
    n: "3",
    title: "Everything gets ruled off",
    body: "Answers and receipts post back to your books. Each item marks itself done, and the month closes on time.",
    chip: { label: "Ruled off", tone: "done" as const },
  },
];

const CAPABILITIES = [
  { title: "Automated chasing", body: "A calm sequence that escalates in tone, then stops the instant your client responds." },
  { title: "No-login client portal", body: "Your client taps a link and answers on their phone. No account, nothing to abandon." },
  { title: "QuickBooks sync", body: "Pull uncategorized charges in, push the answers and receipts back automatically." },
  { title: "Month-end overview", body: "Every client sorted by what is still blocking the close, readable at a glance." },
];

// Orchestrated timeline. `custom` is the step index, so each step's node, text,
// and chip fire in sequence, one beat after the last.
const lineDraw: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.9, ease: EASE, delay: 0.15 } },
};
const lineDrawY: Variants = {
  hidden: { scaleY: 0 },
  show: (i: number) => ({ scaleY: 1, transition: { duration: 0.45, ease: EASE, delay: 0.3 + i * STEP } }),
};
const nodePop: Variants = {
  hidden: { scale: 0, opacity: 0 },
  show: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { delay: 0.2 + i * STEP, type: "spring", stiffness: 420, damping: 16 },
  }),
};
const textRise: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.36 + i * STEP, duration: 0.4, ease: EASE } }),
};
const chipIn: Variants = {
  hidden: { opacity: 0, scale: 0.82 },
  show: (i: number) => ({ opacity: 1, scale: 1, transition: { delay: 0.52 + i * STEP, duration: 0.34, ease: EASE } }),
};

function Chip({ label, tone }: { label: string; tone: "success" | "warning" | "done" }) {
  const cls =
    tone === "warning" ? "pill pill-warning" : tone === "done" ? "pill pill-success" : "pill pill-brand";
  return (
    <span className={cls + " num text-[11px]"}>
      {tone === "done" && <Check size={11} />}
      {label}
    </span>
  );
}

function Node({ n }: { n: string }) {
  return (
    <span className="num relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-bg bg-brand text-[20px] font-bold text-white shadow-brand">
      {n}
    </span>
  );
}

const viewport = { once: true, amount: 0.4 } as const;

export function HowItWorks() {
  return (
    <section id="how" className="section-y bg-surface-2">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="kicker">How it works</p>
          <h2 className="t-h2 mt-3 font-display text-text">Three steps to a closed month.</h2>
          <p className="t-body-lg mt-4 text-muted">
            You connect the books once. From there RuledOff collects what is missing and follows
            up on its own, until every item is in and the month is ruled off.
          </p>
        </Reveal>

        {/* Horizontal flow (desktop): the line draws left to right while the
            nodes pop in on the beat, then each step's text and chip follow. */}
        <motion.div
          className="relative mt-14 hidden md:block"
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          <motion.div
            aria-hidden="true"
            variants={lineDraw}
            className="absolute left-[16.66%] right-[16.66%] top-7 h-[2px] origin-left bg-gradient-to-r from-brand via-brand/40 to-success"
          />
          <div className="grid grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex flex-col items-center text-center">
                <motion.div custom={i} variants={nodePop}>
                  <Node n={s.n} />
                </motion.div>
                <motion.h3 custom={i} variants={textRise} className="mt-6 text-[19px] font-bold text-text">
                  {s.title}
                </motion.h3>
                <motion.p custom={i} variants={textRise} className="mt-2 max-w-[300px] text-[14.5px] leading-relaxed text-muted">
                  {s.body}
                </motion.p>
                <motion.span custom={i} variants={chipIn} className="mt-4">
                  <Chip {...s.chip} />
                </motion.span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Vertical flow (mobile): the connecting line draws downward as each
            node pops in. */}
        <motion.div
          className="mt-10 flex flex-col md:hidden"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative flex gap-5 pb-9 last:pb-0">
              {i < STEPS.length - 1 && (
                <motion.span
                  aria-hidden="true"
                  custom={i}
                  variants={lineDrawY}
                  className="absolute left-7 top-14 bottom-0 w-[2px] origin-top -translate-x-1/2 bg-gradient-to-b from-brand/60 to-success/50"
                />
              )}
              <motion.div custom={i} variants={nodePop}>
                <Node n={s.n} />
              </motion.div>
              <div className="min-w-0 flex-1 pt-1">
                <motion.h3 custom={i} variants={textRise} className="text-[18px] font-bold text-text">
                  {s.title}
                </motion.h3>
                <motion.p custom={i} variants={textRise} className="mt-1.5 text-[14.5px] leading-relaxed text-muted">
                  {s.body}
                </motion.p>
                <motion.span custom={i} variants={chipIn} className="mt-3 inline-block">
                  <Chip {...s.chip} />
                </motion.span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Supporting detail: capabilities stagger in after the flow. */}
        <motion.div
          className="mt-14 border-t border-line pt-10 sm:mt-16"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.08 }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-faint">
            Running the whole time
          </p>
          <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((c) => (
              <motion.div
                key={c.title}
                className="flex flex-col gap-1.5"
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brass" />
                  <h4 className="text-[15px] font-bold text-text">{c.title}</h4>
                </div>
                <p className="text-[13.5px] leading-relaxed text-muted">{c.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
