"use client";

import { motion } from "framer-motion";
import { EASE } from "@/animations/motion";
import { MonoLabel } from "@/components/site/MonoLabel";
import { Reveal } from "@/components/site/Reveal";

const GREEN = "#0E8A5F";
const RED = "#B94B3D";

type Row = {
  client: string;
  status: "open" | "chasing" | "ruled";
  open: number;
  note: string;
};

// Sorted by what is still blocking the close. Calm, not a control panel.
const ROWS: Row[] = [
  { client: "Acme Coffee Roasters", status: "open", open: 3, note: "2 receipts, 1 W-9" },
  { client: "Harbor Yoga Studio", status: "chasing", open: 1, note: "Reminder sent today" },
  { client: "Bright Design Co.", status: "chasing", open: 1, note: "Opened, not answered" },
  { client: "Green Thumb Landscaping", status: "ruled", open: 0, note: "Ruled off Apr 12" },
  { client: "Maple Street Dental", status: "ruled", open: 0, note: "Ruled off Apr 9" },
];

function StatusMark({ status }: { status: Row["status"] }) {
  if (status === "ruled") {
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
  return (
    <span
      className="h-1.5 w-1.5 rounded-full"
      style={{ background: status === "open" ? RED : "#C59B3A" }}
    />
  );
}

export function DashboardSection() {
  return (
    <section className="border-t border-site-border bg-site-paper">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal className="max-w-xl">
          <MonoLabel>Your side of the desk</MonoLabel>
          <h2 className="mt-5 font-editorial text-[clamp(30px,4.4vw,52px)] font-medium leading-[1.08] tracking-[-0.01em] text-site-ink">
            Every client, sorted by what is left.
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-site-secondary">
            One quiet list. The clients still blocking a close sit at the top. The
            ones that are done are ruled off. Nothing else competes for your eye.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-12">
          <div
            className="overflow-hidden rounded-[12px] border border-site-border bg-site-white"
            style={{ boxShadow: "0 30px 60px -44px rgba(17,19,21,0.24)" }}
          >
            <div className="flex items-center justify-between border-b border-site-border px-6 py-4">
              <span className="font-editorial text-lg font-semibold text-site-ink">
                Clients
              </span>
              <span className="font-mono text-[12px] text-site-red">5 open items</span>
            </div>
            <ul>
              {ROWS.map((r, i) => (
                <motion.li
                  key={r.client}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.3, ease: EASE, delay: i * 0.06 }}
                  className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-4 border-b border-site-border px-6 py-[18px] last:border-b-0"
                >
                  <span className="flex justify-center">
                    <StatusMark status={r.status} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium text-site-ink">
                      {r.client}
                    </span>
                    <span className="text-[13px] text-site-secondary">{r.note}</span>
                  </span>
                  <span
                    className="font-mono text-[13px] tabular-nums"
                    style={{ color: r.status === "ruled" ? GREEN : r.open ? RED : "#6F6E69" }}
                  >
                    {r.status === "ruled" ? "ruled off" : `${r.open} open`}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
