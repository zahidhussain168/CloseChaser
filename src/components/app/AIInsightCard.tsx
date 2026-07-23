"use client";

import { useState, useTransition } from "react";
import { Sparkles, ArrowRight, Check, RefreshCw } from "lucide-react";
import { clientInsightAction, type InsightResult } from "@/app/(app)/client-ai-actions";
import { fireChaseAction } from "@/app/(app)/actions";
import { bulkAcceptAction, addQuickItemAction } from "@/app/(app)/client-actions";

const GRADIENT = "linear-gradient(120deg, var(--brand), var(--success))";

export function AIInsightCard({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<InsightResult | null>(null);
  const [actioning, startAction] = useTransition();
  const [done, setDone] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const insight = result?.ok ? result.insight : null;

  const run = () =>
    start(async () => {
      setDone(false);
      setActionErr(null);
      setResult(await clientInsightAction(clientId));
    });

  const doAction = () => {
    if (!insight || insight.action.kind === "none" || done) return;
    const a = insight.action;
    startAction(async () => {
      let res: { ok?: boolean; error?: string } | undefined = undefined;
      if (a.kind === "chase") res = await fireChaseAction(clientId);
      else if (a.kind === "review") res = await bulkAcceptAction(clientId);
      else if (a.kind === "add_item") res = await addQuickItemAction(clientId, { type: a.itemType, title: a.title, note: a.note });
      if (!res || res.ok) {
        setDone(true);
        setActionErr(null);
      } else {
        setActionErr(res.error ?? "Could not complete that.");
      }
    });
  };

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
            <div className="mt-3 h-14 w-full rounded-xl bg-surface-2" />
          </div>
        ) : null}

        {result && !result.ok ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-danger">{result.error}</p>
            <button type="button" onClick={run} className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-2">
              <RefreshCw size={13} /> Try again
            </button>
          </div>
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

            <div className="rounded-xl border-l-2 px-3.5 py-3" style={{ borderColor: "var(--brand)", background: "var(--brand-tint)" }}>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-brand">
                <ArrowRight size={12} /> Do this next
              </span>
              <p className="mt-1 text-sm font-medium text-text">{insight.recommendation}</p>

              {insight.action.kind !== "none" ? (
                done ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--success)" }}>
                    <Check size={16} /> Done
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={doAction}
                    disabled={actioning}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-70"
                  >
                    <Sparkles size={14} /> {actioning ? "Working" : insight.action.label}
                  </button>
                )
              ) : null}
              {actionErr ? <p className="mt-2 text-xs text-danger">{actionErr}</p> : null}
            </div>

            <button
              type="button"
              onClick={run}
              disabled={pending}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-surface-2 disabled:opacity-60"
            >
              <RefreshCw size={13} /> {pending ? "Refreshing" : "Refresh read"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
