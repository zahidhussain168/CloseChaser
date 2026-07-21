"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/site/Button";
import { SiteNav } from "@/components/site/SiteNav";
import { ProgressRing } from "@/components/site/ProgressRing";

const EASE = [0.22, 1, 0.36, 1] as const;

type Row = { label: string; meta: string; state: "done" | "pending" | "overdue" };
const ROWS: Row[] = [
  { label: "March bank statement", meta: "Acme Coffee", state: "done" },
  { label: "Receipt · Office Depot $128.40", meta: "Uncategorized", state: "done" },
  { label: "W-9 · Bright Design Co.", meta: "Waiting 2 days", state: "pending" },
  { label: "April payroll journal", meta: "Overdue", state: "overdue" },
];

function StatePill({ state }: { state: Row["state"] }) {
  if (state === "done") return <span className="pill pill-success"><Check size={12} /> Ruled off</span>;
  if (state === "pending") return <span className="pill pill-warning">Pending</span>;
  return <span className="pill pill-danger">Overdue</span>;
}

function DashboardMock() {
  return (
    <div className="sheet w-full max-w-md overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <div className="text-[13px] font-semibold text-text">April close</div>
          <div className="text-[12px] text-muted">Acme Coffee Roasters</div>
        </div>
        <ProgressRing value={0.66} label="66%" />
      </div>
      <ul className="divide-y divide-line">
        {ROWS.map((r, i) => (
          <motion.li
            key={r.label}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.5 + i * 0.12 }}
            className="flex items-center gap-3 px-5 py-3.5"
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{
                background: r.state === "done" ? "var(--success-tint)" : "var(--surface-2)",
                color: r.state === "done" ? "var(--success)" : "var(--faint)",
              }}
            >
              {r.state === "done" ? <Check size={13} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium text-text">{r.label}</span>
              <span className="block truncate text-[12px] text-muted">{r.meta}</span>
            </span>
            <StatePill state={r.state} />
          </motion.li>
        ))}
      </ul>
      <div className="flex items-center justify-between bg-surface-2 px-5 py-3">
        <span className="text-[12px] text-muted">Reminders send automatically</span>
        <span className="pill pill-brand">Auto-chasing</span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="brand-wash relative overflow-hidden">
      <SiteNav />
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-12 pt-6 sm:gap-14 sm:pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <span className="pill pill-brand mb-5">
            <Sparkles size={13} /> Built for solo bookkeepers
          </span>
          <h1 className="t-display font-display text-text">
            Close the month without{" "}
            <span className="bg-gradient-to-r from-brand to-success bg-clip-text text-transparent">
              chasing clients
            </span>
            .
          </h1>
          <p className="t-body-lg mt-5 max-w-xl text-muted">
            RuledOff collects every document, receipt, and answer blocking your close, then
            chases your client automatically until each item is ruled off. Your client just taps
            a link. No login, no portal, no app.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/signup" size="lg">
              Start free for 14 days <ArrowRight size={18} />
            </Button>
            <Button href="#how" variant="secondary" size="lg">
              See how it works
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted">
            <span className="flex items-center gap-1.5"><Check size={15} className="text-success" /> No card required</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-success" /> Unlimited clients</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-success" /> QuickBooks sync</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
          className="relative flex justify-center lg:justify-end"
        >
          <div className="absolute -right-6 -top-6 hidden h-24 w-24 rounded-2xl bg-brand/10 blur-2xl lg:block" />
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}
