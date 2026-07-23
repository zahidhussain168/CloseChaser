"use client";

import { useState, useTransition } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { clientInsightAction, type InsightResult } from "@/app/(app)/client-ai-actions";

const GRADIENT = "linear-gradient(120deg, var(--brand), var(--success))";

export function AIInsightCard({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<InsightResult | null>(null);
  const insight = result?.ok ? result.insight : null;

  const run = () => start(async () => setResult(await clientInsightAction(clientId)));

  return (
    <div className="overflow-hidden rounded-2xl p-[1.5px]" style={{ background: GRADIENT }}>
      <div className="rounded-[15px] bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: GRADIENT }}>
              <Sparkles size={17} />
            </span>
            <div>
              <div className="text-sm font-bold text-text">AI close analyst</div>
              <div className="text-xs text-ink-muted">A quick read on where this client stands, and what to do next.</div>
            </div>
          </div>
          {!insight && !pending ? (
            <button
              type="button"
              onClick={run}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:translate-y-[1px]"
              style={{ background: GRADIENT }}
            >
              <Sparkles size={15} /> Get AI read
            </button>
          ) : null}
        </div>

        {pending && !insight ? (
          <div className="mt-4 animate-pulse space-y-2.5">
            <div className="h-4 w-2/3 rounded bg-surface-2" />
            <div className="h-3 w-full rounded bg-surface-2" />
            <div className="h-3 w-5/6 rounded bg-surface-2" />
            <div className="mt-3 h-12 w-full rounded-xl bg-surface-2" />
          </div>
        ) : null}

        {result && !result.ok ? (
          <p className="mt-4 text-sm text-danger">{result.error}</p>
        ) : null}

        {insight ? (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-[15px] font-semibold text-text">{insight.headline}</p>
            <ul className="flex flex-col gap-1.5">
              {insight.insights.map((x, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-muted">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--brand)" }} />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border-l-2 px-3.5 py-2.5" style={{ borderColor: "var(--brand)", background: "var(--brand-tint)" }}>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-brand">
                <ArrowRight size={12} /> Do this next
              </span>
              <p className="mt-1 text-sm font-medium text-text">{insight.recommendation}</p>
            </div>
            <button
              type="button"
              onClick={run}
              disabled={pending}
              className="w-fit text-xs font-medium text-ink-muted transition-colors hover:text-ink disabled:opacity-60"
            >
              {pending ? "Refreshing" : "Refresh read"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
