"use client";

import { Camera, Check, Upload } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

function PhoneScreen() {
  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex items-center gap-2 border-b border-line px-5 pb-3 pt-11">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-[12px] font-bold text-white">S</span>
        <span className="text-[13px] font-semibold text-text">Sarah Chen Bookkeeping</span>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-semibold uppercase tracking-wide text-muted">April close</span>
          <span className="num text-muted">2 of 3</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-success" style={{ width: "66%" }} />
        </div>
      </div>

      <div className="px-5 pt-5">
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
      </div>

      <div className="mt-4 flex items-center gap-2 px-5 text-[13px] font-medium text-success">
        <Check size={16} strokeWidth={2.5} /> Bank statement uploaded
      </div>

      <div className="mt-auto px-5 pb-6 pt-5">
        <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-[14px] font-bold text-white shadow-brand">
          <Upload size={16} /> Send back to Sarah
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">Saved as you go. No account needed.</p>
      </div>
    </div>
  );
}

export function MobileShowcase() {
  return (
    <section className="section-y bg-surface-2/60">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 sm:gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal className="order-2 flex justify-center lg:order-1 lg:justify-start">
          <div className="w-[248px] sm:w-[290px] rounded-[42px] border border-line-strong bg-text p-[10px] shadow-elev2">
            <div className="relative h-[512px] sm:h-[600px] overflow-hidden rounded-[33px] bg-bg">
              <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-text" />
              <PhoneScreen />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="order-1 lg:order-2">
          <p className="kicker">What your client sees</p>
          <h2 className="t-h2 mt-3 font-display text-text">
            A client experience they will actually finish.
          </h2>
          <p className="t-body-lg mt-4 text-muted">
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
              <li key={t} className="flex items-start gap-3 text-[15px] text-text">
                <Check size={18} className="mt-0.5 shrink-0 text-success" /> {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
