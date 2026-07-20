"use client";

import { motion } from "framer-motion";
import { Camera, Check } from "lucide-react";
import { EASE } from "@/animations/motion";
import { MonoLabel } from "@/components/site/MonoLabel";
import { Reveal } from "@/components/site/Reveal";

const GREEN = "#0E8A5F";

/** The screen the client sees when they tap the link. No login, no app. */
function PhoneScreen() {
  return (
    <div className="flex h-full flex-col bg-site-bg">
      {/* firm bar (sits below the dynamic island) */}
      <div className="flex items-center gap-2 border-b border-site-border px-5 pb-3 pt-11">
        <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-site-ink text-[11px] font-semibold text-site-white">
          S
        </span>
        <span className="text-[13px] font-medium text-site-ink">
          Sarah Chen Bookkeeping
        </span>
      </div>

      {/* progress */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between">
          <MonoLabel className="text-[10px]">April close</MonoLabel>
          <span className="font-mono text-[11px] text-site-secondary">2 of 3</span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-site-border">
          <motion.div
            className="h-full rounded-full"
            style={{ background: GREEN, transformOrigin: "left" }}
            initial={{ scaleX: 0.15 }}
            whileInView={{ scaleX: 0.66 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
          />
        </div>
      </div>

      {/* the ask */}
      <div className="px-5 pt-5">
        <div className="rounded-[10px] border border-site-border bg-site-white p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[14px] font-medium text-site-ink">Office Depot</span>
            <span className="font-mono text-[13px] text-site-ink">$128.40</span>
          </div>
          <span className="font-mono text-[11px] text-site-secondary">MAR 14</span>
          <p className="mt-3 text-[13px] leading-snug text-site-secondary">
            What was this for?
          </p>
          <div className="mt-2 rounded-[8px] border border-site-border bg-site-bg px-3 py-2 text-[13px] text-site-ink">
            Printer ink and paper
          </div>
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[8px] border border-dashed border-site-border py-2.5 text-[12px] text-site-secondary"
          >
            <Camera size={14} strokeWidth={1.75} />
            Add a photo of the receipt
          </button>
        </div>
      </div>

      {/* done row */}
      <div className="mt-4 px-5">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: GREEN }}>
          <Check size={15} strokeWidth={2.4} />
          Bank statement uploaded
        </div>
      </div>

      <div className="mt-auto px-5 pb-6 pt-5">
        <div className="flex w-full items-center justify-center rounded-[9px] bg-site-ink py-3 text-[14px] font-medium text-site-white">
          Send back to Sarah
        </div>
        <p className="mt-2 text-center text-[11px] text-site-secondary">
          Saved as you go. No account needed.
        </p>
      </div>
    </div>
  );
}

export function Phone() {
  return (
    <section className="border-t border-site-border bg-site-paper">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20 lg:py-32">
        <Reveal>
          <MonoLabel>What your client sees</MonoLabel>
          <h2 className="mt-5 font-editorial text-[clamp(30px,4.4vw,52px)] font-medium leading-[1.08] tracking-[-0.01em] text-site-ink">
            They just open a link.
          </h2>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-site-secondary">
            No account. No app. No password to reset. Your client taps the link in
            their email, answers on their phone, and taps send. That is the whole
            experience.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {[
              "Opens on any phone, no install",
              "Answers save the moment they type",
              "Closing the tab loses nothing",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-[15px] text-site-ink">
                <Check size={16} strokeWidth={2.2} style={{ color: GREEN }} />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Phone */}
        <Reveal delay={0.08} className="flex justify-center lg:justify-end">
          <div
            className="w-[290px] rounded-[42px] border border-site-border bg-site-ink p-[10px]"
            style={{ boxShadow: "0 40px 80px -40px rgba(17,19,21,0.4)" }}
          >
            <div className="relative h-[600px] overflow-hidden rounded-[33px] bg-site-bg">
              {/* dynamic island */}
              <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-site-ink" />
              <PhoneScreen />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
