"use client";

import { motion } from "framer-motion";
import { EASE } from "@/animations/motion";
import { MonoLabel } from "@/components/site/MonoLabel";
import { Reveal } from "@/components/site/Reveal";

const GREEN = "#0E8A5F";
const RED = "#B94B3D";

// Left: the loop a bookkeeper runs by hand. It never actually resolves.
const MANUAL = [
  { label: "Send the first email", tag: "DAY 1" },
  { label: "No reply. Send again", tag: "DAY 4" },
  { label: "Check the inbox again", tag: "DAY 7" },
  { label: "Text them to nudge", tag: "DAY 9" },
  { label: "Still waiting", tag: "DAY 12" },
];

// Right: the same close, handled. Each step resolves on its own.
const RULED = [
  { label: "Request goes out", tag: "AUTO" },
  { label: "Reminder follows up", tag: "AUTO" },
  { label: "Client uploads on their phone", tag: "DONE" },
  { label: "Answer posts to the books", tag: "DONE" },
  { label: "Item closes itself", tag: "CLOSED" },
];

function Tick() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

export function Contrast() {
  return (
    <section id="how" className="border-t border-site-border bg-site-bg">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal>
          <MonoLabel>The difference</MonoLabel>
          <h2 className="mt-5 max-w-2xl font-editorial text-[clamp(30px,4.4vw,52px)] font-medium leading-[1.08] tracking-[-0.01em] text-site-ink">
            The same close, chased two ways.
          </h2>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-site-secondary">
            One of these is your Tuesday. The other one runs without you.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* By hand */}
          <Reveal>
            <div className="h-full rounded-[10px] border border-site-border bg-site-paper p-7 sm:p-9">
              <div className="flex items-center justify-between border-b border-site-border pb-4">
                <span className="font-editorial text-xl font-semibold text-site-ink">
                  By hand
                </span>
                <MonoLabel className="text-site-red">You chase</MonoLabel>
              </div>
              <ol className="mt-6 flex flex-col gap-4">
                {MANUAL.map((s, i) => (
                  <motion.li
                    key={s.label}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.32, ease: EASE, delay: i * 0.1 }}
                    className="flex items-center gap-3 text-[15px] text-site-secondary"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: RED }}
                    />
                    <span className="min-w-0">{s.label}</span>
                    <span className="ml-auto font-mono text-[11px] tracking-wide text-site-secondary">
                      {s.tag}
                    </span>
                  </motion.li>
                ))}
              </ol>
              <p className="mt-7 border-t border-site-border pt-4 font-mono text-xs text-site-red">
                Never actually done.
              </p>
            </div>
          </Reveal>

          {/* With RuledOff */}
          <Reveal delay={0.08}>
            <div
              className="h-full rounded-[10px] border border-site-border bg-site-white p-7 sm:p-9"
              style={{ boxShadow: "0 24px 48px -34px rgba(17,19,21,0.22)" }}
            >
              <div className="flex items-center justify-between border-b border-site-border pb-4">
                <span className="font-editorial text-xl font-semibold text-site-ink">
                  With RuledOff
                </span>
                <MonoLabel className="text-site-green">It chases</MonoLabel>
              </div>
              <ol className="mt-6 flex flex-col gap-4">
                {RULED.map((s, i) => {
                  const done = i === RULED.length - 1;
                  return (
                    <motion.li
                      key={s.label}
                      initial={{ opacity: 0, x: 8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.32, ease: EASE, delay: i * 0.1 }}
                      className="flex items-center gap-3 text-[15px]"
                      style={{ color: done ? GREEN : "#111315" }}
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        <Tick />
                      </span>
                      <span className="min-w-0">{s.label}</span>
                      <span
                        className="ml-auto font-mono text-[11px] tracking-wide"
                        style={{ color: done ? GREEN : "#6F6E69" }}
                      >
                        {s.tag}
                      </span>
                    </motion.li>
                  );
                })}
              </ol>
              <p className="mt-7 border-t border-site-border pt-4 font-mono text-xs text-site-green">
                Done, without you.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
