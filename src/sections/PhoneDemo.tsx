"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Camera } from "lucide-react";
import { RuledOff } from "@/components/RuledOff";
import { ProgressRing } from "@/components/site/ProgressRing";

/**
 * The animated product moment on the hero: a looping phone demo of the actual
 * client experience. The client opens the branded link, types an answer, snaps
 * a receipt, and each item rules off with the signature green strike, then the
 * close completes and the loop resets. All motion is transform/opacity; under
 * prefers-reduced-motion it holds the finished state instead of looping.
 */

const PHASE_MS = [1400, 1600, 1000, 1600, 1000, 2200] as const;
const EASE = [0.22, 1, 0.36, 1] as const;

function TapDot({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none absolute right-6 z-20 h-7 w-7 rounded-full"
          style={{ background: "rgba(91,35,51,0.14)", boxShadow: "0 0 0 2px var(--brand)" }}
          aria-hidden="true"
        >
          <span className="absolute inset-0 animate-ping rounded-full" style={{ background: "rgba(91,35,51,0.25)" }} />
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

function Item({
  title,
  meta,
  done,
  children,
}: {
  title: string;
  meta: string;
  done: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl border px-3.5 py-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors"
          style={{
            background: done ? "var(--success-tint)" : "var(--surface-2)",
            color: done ? "var(--success)" : "var(--faint)",
          }}
        >
          {done ? <Check size={13} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold" style={{ color: "var(--text)" }}>
            <RuledOff done={done}>{title}</RuledOff>
          </span>
          <span className="block truncate text-[11px]" style={{ color: "var(--muted)" }}>{meta}</span>
        </span>
        {done ? (
          <span className="pill pill-success shrink-0 text-[10px]"><Check size={10} /> Ruled off</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function PhoneDemo() {
  const [phase, setPhase] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const on = () => setReduced(m.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);

  // Pause the loop when the demo is scrolled out of view so it never burns
  // frames off-screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => setVisible(entries[0]?.isIntersecting ?? true), {
      threshold: 0.15,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !visible) return;
    const t = setTimeout(() => setPhase((p) => (p + 1) % PHASE_MS.length), PHASE_MS[phase]);
    return () => clearTimeout(t);
  }, [phase, reduced, visible]);

  const p = reduced ? 4 : phase;
  const bDone = p >= 2;
  const cDone = p >= 4;
  const answering = p === 1;
  const uploading = p === 3;
  const complete = !reduced && p === 5;
  const pct = (1 + (bDone ? 1 : 0) + (cDone ? 1 : 0)) / 3;

  return (
    <div ref={rootRef} className="relative mx-auto w-[264px]">
      {/* Phone frame */}
      <div
        className="relative overflow-hidden rounded-[2.4rem] border-[10px] p-0 shadow-2xl"
        style={{ borderColor: "#1a1420", background: "var(--bg)" }}
      >
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-20 h-5 w-28 -translate-x-1/2 rounded-b-2xl" style={{ background: "#1a1420" }} />

        <div className="relative min-h-[452px] px-4 pb-5 pt-8">
          {/* Firm header */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: "var(--brass)" }}>
              SC
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold" style={{ color: "var(--text)" }}>Sarah Chen Bookkeeping</div>
              <div className="num text-[11px]" style={{ color: "var(--muted)" }}>July close</div>
            </div>
            <ProgressRing value={pct} size={38} stroke={4} />
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            <Item title="March payroll journal" meta="Ruled off earlier" done />

            <div className="relative">
              <TapDot show={p === 0} />
              <Item title="Office Depot, $128.40" meta={bDone ? "Office supplies" : "What was this charge?"} done={bDone}>
                <AnimatePresence>
                  {answering ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="mt-2.5 rounded-lg px-2.5 py-2 text-[12px]"
                      style={{ background: "var(--brand-tint)", color: "var(--brand)" }}
                    >
                      Office supplies
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </Item>
            </div>

            <div className="relative">
              <TapDot show={p === 3 && !uploading} />
              <Item title="July bank statement" meta={cDone ? "statement.pdf" : "Upload the PDF"} done={cDone}>
                <AnimatePresence>
                  {uploading ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="mt-2.5 flex items-center gap-2 rounded-lg border px-2.5 py-2"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-md text-white" style={{ background: "var(--brand)" }}>
                        <Camera size={15} />
                      </span>
                      <span className="text-[11.5px] font-medium" style={{ color: "var(--text)" }}>statement.pdf attached</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </Item>
            </div>
          </div>

          {/* Completion moment */}
          <AnimatePresence>
            {complete ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
                style={{ background: "linear-gradient(180deg, rgba(255,253,247,0.86), var(--bg))" }}
              >
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 16 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full text-white"
                  style={{ background: "var(--success)" }}
                >
                  <Check size={28} strokeWidth={3} />
                </motion.span>
                <div className="mt-4 font-display text-[26px] leading-none" style={{ color: "var(--text)" }}>
                  <RuledOff done>Ruled off.</RuledOff>
                </div>
                <p className="mt-2 text-[12.5px]" style={{ color: "var(--muted)" }}>July is closed. Sarah did not send a single reminder.</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
