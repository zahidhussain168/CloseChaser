"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { DoubleRule } from "@/components/DoubleRule";
import { HandCheck } from "@/components/HandCheck";

/**
 * The hero artifact: a small, live ledger sheet that plays the product's
 * signature moment on load. Two rows rule off (deep-green ink + the double-rule
 * + a hand check); one stays outstanding in red ink. This is the ONE place the
 * design shows off, per the brief, and it doubles as a product explainer.
 */
const ROWS = [
  { label: "November bank statement", meta: "uploaded", amount: null, done: true },
  { label: "Office supplies", meta: "Office Depot", amount: "128.40", done: true },
  { label: "Ask My Accountant", meta: "Transfer", amount: "2,300.00", done: false },
];

export function LedgerHero() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="sheet w-full max-w-sm p-5 sm:p-6" aria-hidden="true">
      <div
        className="flex items-baseline justify-between border-b pb-3"
        style={{ borderColor: "var(--rule)", borderBottomWidth: 2 }}
      >
        <span className="font-display text-lg font-semibold">November close</span>
        <span className="num text-xs text-ink-muted">3 items</span>
      </div>

      <ul className="mt-1">
        {ROWS.map((r, i) => (
          <li
            key={i}
            className="reveal-row relative py-3.5"
            style={{ ["--i"]: i + 1 } as CSSProperties}
          >
            <div className="grid grid-cols-[1.5rem_1fr_auto] items-baseline gap-2">
              <span className="flex justify-center">
                {r.done ? (
                  <HandCheck animate={drawn} color="var(--cleared)" size={16} />
                ) : (
                  <span
                    className="mt-0.5 inline-block h-3.5 w-3.5 rounded-[3px] border"
                    style={{ borderColor: "var(--rule-strong)" }}
                  />
                )}
              </span>
              <span className="min-w-0">
                <span
                  className="block truncate text-sm"
                  style={r.done ? { color: "var(--cleared)" } : undefined}
                >
                  {r.label}
                </span>
                <span className="num block text-[11px] text-ink-muted">
                  {r.meta}
                </span>
              </span>
              <span
                className="num text-sm"
                style={{
                  color: r.done
                    ? "var(--cleared)"
                    : r.amount
                      ? "var(--pending)"
                      : "var(--ink-muted)",
                }}
              >
                {r.amount ? `$${r.amount}` : ""}
              </span>
            </div>
            {r.done && <DoubleRule drawn={drawn} className="ml-8 mr-1 mt-2.5" />}
          </li>
        ))}
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
  );
}
