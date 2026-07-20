"use client";

import { motion } from "framer-motion";
import { Mail, Upload, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EASE } from "@/animations/motion";
import { MonoLabel } from "@/components/site/MonoLabel";
import { Reveal } from "@/components/site/Reveal";

const GREEN = "#0E8A5F";

type Beat = {
  day: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  done?: boolean;
};

// Email only. Escalation is in the words, not the channel.
const BEATS: Beat[] = [
  {
    day: "Day 1",
    title: "The first email goes out",
    detail: "Friendly. Here is what I need to close your books.",
    icon: Mail,
  },
  {
    day: "Day 3",
    title: "A second reminder follows",
    detail: "Firmer, and specific about what is still missing.",
    icon: Mail,
  },
  {
    day: "Day 8",
    title: "Your client uploads",
    detail: "They tap the link and send it back from their phone.",
    icon: Upload,
  },
  {
    day: "Done",
    title: "The item closes itself",
    detail: "Reminders stop the moment it is answered.",
    icon: Check,
    done: true,
  },
];

export function Timeline() {
  return (
    <section className="border-t border-site-border bg-site-bg">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal>
          <MonoLabel>The follow-up</MonoLabel>
          <h2 className="mt-5 max-w-2xl font-editorial text-[clamp(30px,4.4vw,52px)] font-medium leading-[1.08] tracking-[-0.01em] text-site-ink">
            It follows up so you never have to.
          </h2>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-site-secondary">
            A calm sequence of emails, each one a little firmer, that stops itself
            the instant your client responds.
          </p>
        </Reveal>

        {/* Rail */}
        <div className="mt-16">
          {/* connecting line */}
          <div className="relative">
            <motion.div
              aria-hidden="true"
              className="absolute left-0 top-[19px] hidden h-px w-full origin-left bg-site-border lg:block"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, ease: EASE }}
            />
            <ol className="grid gap-10 lg:grid-cols-4 lg:gap-6">
              {BEATS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.li
                    key={b.day}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.32, ease: EASE, delay: 0.15 + i * 0.12 }}
                    className="relative flex gap-4 lg:block"
                  >
                    <span
                      className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-site-bg"
                      style={{
                        borderColor: b.done ? GREEN : "#D9D4CA",
                        color: b.done ? GREEN : "#6F6E69",
                      }}
                    >
                      <Icon size={17} strokeWidth={1.9} />
                    </span>
                    <div className="lg:mt-5">
                      <span
                        className="font-mono text-[11px] uppercase tracking-[0.16em]"
                        style={{ color: b.done ? GREEN : "#6F6E69" }}
                      >
                        {b.day}
                      </span>
                      <h3 className="mt-1.5 text-[16px] font-semibold text-site-ink">
                        {b.title}
                      </h3>
                      <p className="mt-1 max-w-[15rem] text-[14px] leading-snug text-site-secondary">
                        {b.detail}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
