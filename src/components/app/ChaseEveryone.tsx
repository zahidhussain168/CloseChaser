"use client";

import { useState, useTransition } from "react";
import { Send, Check } from "lucide-react";
import { chaseAllAction, type ChaseAllResult } from "@/app/(app)/bulk-actions";

/**
 * One-click firm-wide chase. Shown only when clients are actually waiting on
 * items, with a confirm before it sends real email.
 */
export function ChaseEveryone({ count }: { count: number }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ChaseAllResult | null>(null);

  if (count === 0) return null;

  const fire = () => {
    const ok = window.confirm(
      `Send a chase to ${count} client${count === 1 ? "" : "s"} now? Each gets their branded link, and auto-reminders take over from there.`,
    );
    if (ok) start(async () => setResult(await chaseAllAction()));
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{
        borderColor: "var(--brand)",
        background: "linear-gradient(120deg, var(--brand-tint), transparent 70%)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-brand"
            style={{ background: "var(--brand)" }}
          >
            <Send size={19} />
          </span>
          <div>
            <div className="text-[15px] font-bold text-text">Chase everyone at once</div>
            <div className="mt-0.5 text-[13.5px] text-ink-muted">
              {result
                ? "Done. The daily reminders take it from here."
                : `${count} client${count === 1 ? " is" : "s are"} waiting on items. Nudge them all in one click.`}
            </div>
          </div>
        </div>

        {result ? (
          <span className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold" style={{ background: "var(--success-tint)", color: "var(--success)" }}>
            <Check size={16} /> Chased {result.chased}
            {result.failed ? `, ${result.failed} failed` : ""}
          </span>
        ) : (
          <button
            type="button"
            onClick={fire}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition-[background-color,transform] duration-150 hover:brightness-110 active:translate-y-[1px] disabled:opacity-70"
            style={{ background: "var(--brand)" }}
          >
            <Send size={16} />
            {pending ? "Chasing everyone" : `Chase all ${count}`}
          </button>
        )}
      </div>
    </div>
  );
}
