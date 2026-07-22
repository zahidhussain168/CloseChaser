"use client";

import { motion, type Variants } from "framer-motion";
import { Camera, Check, Upload } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { Parallax } from "@/components/site/Parallax";
import { Aurora } from "@/components/site/Aurora";

const EASE = [0.22, 1, 0.36, 1] as const;

// The phone fills itself in when it scrolls into view: the progress bar draws,
// then each row of the checklist arrives in sequence.
const bar: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { delay: 0.25, duration: 0.7, ease: EASE } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.2, duration: 0.42, ease: EASE } }),
};

function PhoneScreen() {
  return (
    <motion.div
      className="flex h-full flex-col bg-bg"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="flex items-center gap-2 border-b border-line px-5 pb-3 pt-11">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-[12px] font-bold text-white">S</span>
        <span className="text-[13px] font-semibold text-text">Sarah Chen Bookkeeping</span>
      </div>

      <div className="px-5 pt-4">
        <motion.div custom={0} variants={item} className="flex items-center justify-between text-[12px]">
          <span className="font-semibold uppercase tracking-wide text-muted">April close</span>
          <span className="num text-muted">2 of 3</span>
        </motion.div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <motion.div
            variants={bar}
            className="h-full origin-left rounded-full bg-gradient-to-r from-brand to-success"
            style={{ width: "66%" }}
          />
        </div>
      </div>

      <motion.div custom={1} variants={item} className="px-5 pt-5">
        <div className="sheet rounded-xl p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[14px] font-semibold text-text">Office Depot</span>
            <span className="num text-[14px] font-semibold text-text">$128.40</span>
          </div>
          <span className="num text-[11px] text-muted">Mar 14</span>
          <p className="mt-3 text-[13px] text-muted">What was this for?</p>
          <div className="mt-2 rounded-lg border border-line-strong bg-bg px-3 py-2 text-[13px] text-text">
            Printer ink and paper
          </div>
          <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong py-2.5 text-[12px] font-medium text-muted">
            <Camera size={15} /> Snap the receipt
          </button>
        </div>
      </motion.div>

      <motion.div custom={2} variants={item} className="mt-4 flex items-center gap-2 px-5 text-[13px] font-medium text-success">
        <Check size={16} strokeWidth={2.5} /> Bank statement uploaded
      </motion.div>

      <motion.div custom={3} variants={item} className="mt-auto px-5 pb-6 pt-5">
        <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-[14px] font-bold text-white shadow-brand">
          <Upload size={16} /> Send back to Sarah
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">Saved as you go. No account needed.</p>
      </motion.div>
    </motion.div>
  );
}

/** Client experience: a dark, full-bleed stage that lets the phone mockup read
 *  like product photography against a backdrop. */
export function MobileShowcase() {
  return (
    <section className="relative overflow-hidden bg-[#101f36] py-24 text-white sm:py-32">
      {/* drifting stage glow behind the phone */}
      <Aurora variant="dark" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 sm:gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Parallax travel={120} className="order-2 lg:order-1">
          <Reveal className="flex justify-center lg:justify-start">
            <div className="w-[248px] rounded-[42px] border border-white/10 bg-[#060c16] p-[10px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] sm:w-[300px]">
              <div className="relative h-[512px] overflow-hidden rounded-[33px] bg-bg sm:h-[620px]">
                <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-[#060c16]" />
                <PhoneScreen />
              </div>
            </div>
          </Reveal>
        </Parallax>

        <Reveal delay={0.08} className="order-1 lg:order-2">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass">
            What your client sees
          </p>
          <h2 className="t-h2 mt-3 font-display text-white">
            A client experience they will actually finish.
          </h2>
          <p className="t-body-lg mt-4 text-slate-300">
            Every incumbent tool dies because clients refuse portals and logins. RuledOff sends one
            link. Your client answers on their phone, snaps a photo of the receipt, and taps send.
            That is the whole thing.
          </p>
          <ul className="mt-7 flex flex-col gap-3">
            {[
              "Opens on any phone, nothing to install",
              "Answers save the moment they type",
              "Closing the tab loses nothing",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] text-slate-100">
                <Check size={18} className="mt-0.5 shrink-0 text-emerald-400" /> {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
