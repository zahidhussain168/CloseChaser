"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";

export type DashRow = {
  id: string;
  name: string;
  email: string;
  books: string;
  done: number;
  totalItems: number;
  fill: number;
  category: "toChase" | "chasing" | "ruled" | "empty";
  statusLabel: string;
  statusCls: string;
  activity: string;
  activityTone: "ok" | "warn" | "muted";
};

const TABS = [
  { key: "all", label: "All" },
  { key: "toChase", label: "To chase" },
  { key: "chasing", label: "Chasing" },
  { key: "ruled", label: "Ruled off" },
] as const;

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function toneColor(t: DashRow["activityTone"]) {
  if (t === "ok") return "var(--cleared)";
  if (t === "warn") return "var(--pending)";
  return "var(--ink-muted)";
}

export function ClientsTable({ rows }: { rows: DashRow[] }) {
  const [tab, setTab] = useState<string>("all");

  const counts: Record<string, number> = {
    all: rows.length,
    toChase: rows.filter((r) => r.category === "toChase").length,
    chasing: rows.filter((r) => r.category === "chasing").length,
    ruled: rows.filter((r) => r.category === "ruled").length,
  };
  const shown = tab === "all" ? rows : rows.filter((r) => r.category === tab);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <h2 className="t-h3 font-display font-semibold">Clients</h2>
        <div className="flex flex-wrap gap-1 rounded-xl bg-surface-2 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                (tab === t.key ? "bg-surface text-text shadow-sm" : "text-ink-muted hover:text-text")
              }
            >
              {t.label} <span className="num text-xs text-faint">{counts[t.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sheet overflow-hidden">
        <div className="hidden grid-cols-[1.7fr_1fr_7rem_11rem] items-center gap-4 border-b border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-faint md:grid">
          <span>Client</span>
          <span>Progress</span>
          <span>Status</span>
          <span className="text-right">Activity</span>
        </div>

        {shown.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-ink-muted">No clients in this view.</div>
        ) : (
          shown.map((r) => (
            <Link
              key={r.id}
              href={`/clients/${r.id}`}
              className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line px-5 py-3.5 transition-colors last:border-0 hover:bg-surface-2/60 md:grid-cols-[1.7fr_1fr_7rem_11rem]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-[13px] font-bold text-brand">
                  {initials(r.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-text">{r.name}</span>
                  <span className="num block truncate text-xs text-ink-muted">
                    {r.email} · {r.books}
                  </span>
                </span>
              </span>

              <span className="hidden items-center gap-2 md:flex">
                {r.totalItems > 0 ? (
                  <>
                    <span className="ink-progress block flex-1" style={{ ["--fill"]: r.fill } as CSSProperties} aria-hidden="true">
                      <span />
                    </span>
                    <span className="num text-[11px] text-ink-muted">{r.done}/{r.totalItems}</span>
                  </>
                ) : (
                  <span className="text-xs text-faint">no items</span>
                )}
              </span>

              <span className="hidden md:block">
                <span className={r.statusCls + " num"}>{r.statusLabel}</span>
              </span>

              <span className="flex items-center justify-end gap-2.5">
                <span className="hidden whitespace-nowrap text-xs md:inline" style={{ color: toneColor(r.activityTone) }}>
                  {r.activity}
                </span>
                <span className={r.statusCls + " num md:hidden"}>{r.statusLabel}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
