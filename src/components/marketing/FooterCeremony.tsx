"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DoubleRule } from "@/components/DoubleRule";

/** Final CTA moment: the line, the double-rule drawing beneath it, then the CTA. */
export function FooterCeremony() {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative mx-auto max-w-5xl px-6 py-[120px] text-center"
    >
      <h2
        className="font-display font-semibold"
        style={{ fontSize: "clamp(30px, 4.5vw, 56px)", lineHeight: 1.05 }}
      >
        Close the month. Rule it off.
      </h2>
      <div className="mx-auto mt-5 w-44">
        <DoubleRule drawn={shown} />
      </div>
      <div className="mt-10">
        <Link href="/signup" className="btn btn-primary px-6 py-3.5 text-base">
          Create your firm
        </Link>
      </div>
    </section>
  );
}
