"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { DoubleRule } from "@/components/DoubleRule";
import { HandCheck } from "@/components/HandCheck";

/**
 * The hero artifact: a small, live ledger sheet that plays the signature
 * ruled-off moment on load. Two rows rule off in deep-green with the double-rule
 * and a hand check; one stays outstanding in red ink with the client mid-reply
 * (typing indicator). A second sheet sits behind it like a stack of ledger paper.
 */
export function LedgerHero() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full max-w-sm">
      {/* Stacked sheet behind, like a pile of ledger paper. */}
      <div
        aria-hidden="true"
        className="sheet absolute inset-0"
        style={{
          background: "var(--paper-sheet)",
          transform: "rotate(2deg) translate(12px, 12px)",
        }}
      />

      {/* Front card: the one permitted shadow on the page. */}
      <div
        className="sheet relative p-5 sm:p-6"
        style={{ boxShadow: "0 8px 24px rgba(35, 42, 37, 0.08)" }}
        aria-hidden="true"
      >
        {/* Client chip + timestamp */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="num flex h-8 w-8 items-center justify-center rounded-full text-xs"
              style={{ background: "var(--paper-deep)", color: "var(--ink)" }}
            >
              DM
            </span>
            <span>
              <span className="block text-sm font-medium leading-tight">
                Dana M
              </span>
              <span className="block text-[11px] leading-tight text-ink-muted">
                Meridian Coffee
              </span>
            </span>
          </div>
          <span className="num text-[11px] text-ink-muted">Nudged 2h ago</span>
        </div>

        <div
          className="mt-4 flex items-baseline justify-between border-b pb-3"
          style={{ borderColor: "var(--rule)", borderBottomWidth: 2 }}
        >
          <span className="font-display text-base font-semibold">
            November close
          </span>
          <span className="num text-xs text-ink-muted">3 items</span>
        </div>

        <ul className="mt-1">
          {/* Row 1: document, ruled off */}
          <Row i={1} drawn={drawn} label="November bank statement" meta="uploaded" done />
          {/* Row 2: transaction, ruled off */}
          <Row i={2} drawn={drawn} label="Office supplies" meta="Office Depot" amount="128.40" done />
          {/* Row 3: outstanding, client mid-reply */}
          <li
            className="reveal-row relative py-3.5"
            style={{ ["--i"]: 3 } as CSSProperties}
          >
            <div className="grid grid-cols-[1.5rem_1fr_auto] items-baseline gap-2">
              <span className="flex justify-center">
                <span
                  className="mt-0.5 inline-block h-3.5 w-3.5 rounded-[3px] border"
                  style={{ borderColor: "var(--rule-strong)" }}
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm">Ask My Accountant</span>
                <span className="mt-1 flex items-center gap-1.5">
                  <span className="typing" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="text-[11px] text-ink-muted">Dana is replying</span>
                </span>
              </span>
              <span className="num text-sm" style={{ color: "var(--pending)" }}>
                $2,300.00
              </span>
            </div>
          </li>
        </ul>

        <div
          className="mt-2 flex items-baseline justify-between border-t pt-3"
          style={{ borderColor: "var(--rule)" }}
        >
          <span className="text-xs text-ink-muted">1 left to rule off</span>
          <span className="num text-xs" style={{ color: "var(--pending)" }}>
            1 open
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({
  i,
  drawn,
  label,
  meta,
  amount,
  done,
}: {
  i: number;
  drawn: boolean;
  label: string;
  meta: string;
  amount?: string;
  done?: boolean;
}) {
  return (
    <li
      className="reveal-row relative py-3.5"
      style={{ ["--i"]: i } as CSSProperties}
    >
      <div className="grid grid-cols-[1.5rem_1fr_auto] items-baseline gap-2">
        <span className="flex justify-center">
          <HandCheck animate={drawn} color="var(--cleared)" size={16} />
        </span>
        <span className="min-w-0">
          <span
            className="block truncate text-sm"
            style={{ color: "var(--cleared)" }}
          >
            {label}
          </span>
          <span className="num block text-[11px] text-ink-muted">{meta}</span>
        </span>
        <span className="num text-sm" style={{ color: "var(--cleared)" }}>
          {amount ? `$${amount}` : ""}
        </span>
      </div>
      {done && <DoubleRule drawn={drawn} className="ml-8 mr-1 mt-2.5" />}
    </li>
  );
}
