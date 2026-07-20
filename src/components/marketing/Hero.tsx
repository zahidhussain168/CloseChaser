"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Wordmark } from "@/components/Wordmark";
import { AmbientLedger } from "./AmbientLedger";
import { LedgerHero } from "./LedgerHero";
import { Magnetic } from "./Magnetic";

const QUIET_LINK =
  "tap text-sm text-ink-muted underline decoration-1 underline-offset-4 transition-colors hover:text-ink";

export function Hero() {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setInView(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  function spotlight(e: MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <section
      className="relative overflow-hidden pb-20 pt-12 lg:pb-24 lg:pt-16"
      style={{ background: "var(--paper)" }}
    >
      <AmbientLedger />
      <span className="folio" style={{ zIndex: 10 }}>
        01
      </span>
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <Wordmark size={28} />
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1
              className={clsx(
                "mask-reveal t-display font-display font-semibold",
                inView && "is-in",
              )}
            >
              <span className="mask-line">
                <span>Chase the close, not your clients.</span>
              </span>
            </h1>
            <p className="t-body-lg mt-7 max-w-lg text-ink-muted">
              RuledOff finds what is blocking a client&apos;s month-end and chases
              them for it with a branded link they open on their phone. No
              account, no login, no download. When every item is answered, the
              books are{" "}
              <span className="font-display" style={{ color: "var(--cleared)" }}>
                ruled off
              </span>
              .
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Magnetic>
                <Link href="/signup" className="btn btn-primary px-6 text-base">
                  Create your firm
                </Link>
              </Magnetic>
              <Link href="/login" className={QUIET_LINK}>
                Sign in
              </Link>
            </div>
            <p className="t-small mt-12 text-ink-muted">
              Built for solo bookkeepers.{" "}
              <span className="num" style={{ color: "var(--ink)" }}>
                $29
              </span>
              /mo flat, unlimited clients.
            </p>
          </div>
          <div
            className={clsx(
              "fan spot flex justify-center rounded-sheet lg:justify-end",
              inView && "is-in",
            )}
            onMouseMove={spotlight}
          >
            <LedgerHero />
          </div>
        </div>
      </div>
    </section>
  );
}
