"use client";

import { Check } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { ProgressRing } from "@/components/site/ProgressRing";

const CLIENTS = [
  { name: "Acme Coffee Roasters", note: "2 receipts, 1 W-9", status: "overdue", val: "3 open" },
  { name: "Harbor Yoga Studio", note: "Reminder sent today", status: "pending", val: "1 open" },
  { name: "Bright Design Co.", note: "Opened, not answered", status: "pending", val: "1 open" },
  { name: "Green Thumb Landscaping", note: "Ruled off Apr 12", status: "done", val: "done" },
];

function dot(status: string) {
  return status === "done" ? "var(--success)" : status === "overdue" ? "var(--danger)" : "var(--warning)";
}

export function AppShowcase() {
  return (
    <section className="section-y">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 sm:gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <p className="kicker">The bookkeeper&apos;s view</p>
          <h2 className="t-h2 mt-3 font-display text-text">
            See every client, sorted by what is left.
          </h2>
          <p className="t-body-lg mt-4 text-muted">
            One dashboard. The clients still blocking a close sit at the top; the ones that are done
            are ruled off. Progress rings and color-coded pills tell you where to look without
            reading a word.
          </p>
          <ul className="mt-7 flex flex-col gap-3">
            {[
              "Prioritized by what is most blocking the close",
              "Live status the moment a client opens the link",
              "A weekly rollup of exactly what is holding you up",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] text-text">
                <Check size={18} className="mt-0.5 shrink-0 text-success" /> {t}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="sheet overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <div className="text-[15px] font-bold text-text">Clients</div>
                <div className="text-[12px] text-muted">Sorted by most blocking</div>
              </div>
              <ProgressRing value={0.5} size={54} stroke={5} label="50%" />
            </div>
            <ul className="divide-y divide-line">
              {CLIENTS.map((c) => (
                <li key={c.name} className="flex items-center gap-3 px-5 py-4">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dot(c.status) }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-text">{c.name}</span>
                    <span className="block truncate text-[12.5px] text-muted">{c.note}</span>
                  </span>
                  <span
                    className="num text-[13px] font-semibold"
                    style={{ color: c.status === "done" ? "var(--success)" : c.status === "overdue" ? "var(--danger)" : "var(--warning)" }}
                  >
                    {c.val}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
