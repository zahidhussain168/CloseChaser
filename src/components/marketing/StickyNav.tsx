"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Wordmark } from "@/components/Wordmark";

/** Slides down once the reader scrolls past the hero. */
export function StickyNav() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={clsx("sticky-nav", visible && "is-visible")}>
      <div
        style={{
          background: "var(--paper)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="tap" aria-label="RuledOff home">
            <Wordmark size={18} />
          </Link>
          <Link
            href="/pricing"
            className="num hidden text-sm text-ink-muted transition-colors hover:text-ink sm:block"
          >
            $29/mo flat
          </Link>
          <Link href="/signup" className="btn btn-primary px-4 text-sm">
            Create your firm
          </Link>
        </div>
      </div>
    </div>
  );
}
