"use client";

import { motion, type Variants } from "framer-motion";
import { Check } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { Parallax } from "@/components/site/Parallax";
import { ProgressRing } from "@/components/site/ProgressRing";

const EASE = [0.22, 1, 0.36, 1] as const;

const CLIENTS = [
  { name: "Acme Coffee Roasters", note: "2 receipts, 1 W-9 outstanding", status: "overdue", val: "3 open" },
  { name: "Harbor Yoga Studio", note: "Reminder sent today", status: "pending", val: "1 open" },
  { name: "Bright Design Co.", note: "Opened, not answered yet", status: "pending", val: "1 open" },
  { name: "Nomad Web Studio", note: "Statement back from client", status: "review", val: "review" },
  { name: "Green Thumb Landscaping", note: "Ruled off Apr 12", status: "done", val: "done" },
];

function color(status: string) {
  if (status === "done") return "var(--success)";
  if (status === "overdue") return "var(--danger)";
  if (status === "review") return "var(--brand)";
  return "var(--warning)";
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// The card lifts into view, then the client rows populate one by one, like the
// dashboard filling in. The rollup footer settles last.
const card: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.28 } },
};
const row: Variants = {
  hidden: { opacity: 0, x: 16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};
const footer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: EASE, delay: 0.28 + CLIENTS.length * 0.09 } },
};

export function AppShowcase() {
  return (
    <section className="section-y">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">The bookkeeper&apos;s view</p>
          <h2 className="t-h2 mt-3 font-display text-text">
            See every client, sorted by what is left.
          </h2>
          <p className="t-body-lg mt-4 text-muted">
            One dashboard. The clients still blocking a close sit at the top; the ones that are done
            are ruled off. Progress rings and color-coded pills tell you where to look without
            reading a word.
          </p>
        </Reveal>

        {/* The scaled-up client list is the focal point: it animates in, then
            drifts gently on scroll (GSAP) for depth against the section. */}
        <Parallax travel={100} className="mx-auto mt-12 max-w-3xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={card}
        >
          <div className="sheet overflow-hidden rounded-2xl shadow-elev2">
            <div className="flex items-center justify-between border-b border-line bg-surface px-6 py-5 sm:px-8">
              <div>
                <div className="text-[17px] font-bold text-text sm:text-[19px]">Clients</div>
                <div className="text-[13px] text-muted">Sorted by most blocking the close</div>
              </div>
              <ProgressRing value={0.5} size={64} stroke={6} label="50%" />
            </div>

            <motion.ul className="divide-y divide-line" variants={list}>
              {CLIENTS.map((c) => (
                <motion.li
                  key={c.name}
                  variants={row}
                  className="flex items-center gap-4 px-6 py-4 sm:px-8 sm:py-[18px]"
                >
                  <span
                    className="num flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                    style={{ background: color(c.status) + "1a", color: color(c.status) }}
                  >
                    {initials(c.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-text">{c.name}</span>
                    <span className="block truncate text-[13px] text-muted">{c.note}</span>
                  </span>
                  <span
                    className="num shrink-0 rounded-full px-3 py-1 text-[12.5px] font-semibold"
                    style={{ background: color(c.status) + "14", color: color(c.status) }}
                  >
                    {c.status === "done" ? (
                      <span className="inline-flex items-center gap-1">
                        <Check size={13} /> {c.val}
                      </span>
                    ) : (
                      c.val
                    )}
                  </span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div
              variants={footer}
              className="flex flex-col gap-1 border-t border-line bg-surface-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8"
            >
              <span className="text-[13px] text-muted">
                This week: <span className="font-semibold text-text">2 receipts, 1 W-9, 1 statement</span> blocking 3 closes
              </span>
              <span className="pill pill-brand num text-[11px]">Chasing automatically</span>
            </motion.div>
          </div>
        </motion.div>
        </Parallax>
      </div>
    </section>
  );
}
