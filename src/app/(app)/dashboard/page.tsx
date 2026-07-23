import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, ClipboardCheck, EyeOff, CheckCircle2 } from "lucide-react";
import { getDashboard, getFirm } from "@/lib/data";
import { AddClientForm } from "@/components/app/AddClientForm";
import { BlockingRollup } from "@/components/app/BlockingRollup";
import { ChaseEveryone } from "@/components/app/ChaseEveryone";
import { BulkAcceptButton } from "@/components/app/ClientQuickActions";
import { ClientsTable, type DashRow } from "@/components/app/ClientsTable";
import { ProgressRing } from "@/components/site/ProgressRing";
import { formatMonth, monthKey, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard · RuledOff" };

function Kpi({
  value,
  label,
  color,
  bg,
  Icon,
}: {
  value: number;
  label: string;
  color: string;
  bg: string;
  Icon: typeof Inbox;
}) {
  return (
    <div className="sheet p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: bg, color }}>
        <Icon size={17} />
      </span>
      <div className="num mt-2.5 text-[28px] font-bold leading-none" style={{ color }}>{value}</div>
      <div className="mt-1 text-[13px] text-ink-muted">{label}</div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { subscribed?: string };
}) {
  const [{ clients, rollup }, firm] = await Promise.all([getDashboard(), getFirm()]);
  const month = formatMonth(monthKey());
  const justSubscribed = searchParams.subscribed === "1";

  const totalOpen = clients.reduce((n, c) => n + c.openCount, 0);
  const ruledOff = clients.filter((c) => c.period?.status === "closed" || (!c.openCount && c.totalItems > 0)).length;
  const notOpened = clients.filter((c) => c.period?.status === "chasing" && c.openCount > 0 && !c.lastOpenedAt).length;
  const totalItems = clients.reduce((n, c) => n + c.totalItems, 0);
  const totalDone = clients.reduce((n, c) => n + (c.totalItems - c.openCount), 0);
  const overallFill = totalItems ? totalDone / totalItems : 0;
  const overallPct = Math.round(overallFill * 100);
  const chaseable = clients.filter((c) => c.openCount > 0 && c.email).length;
  const totalAnswered = clients.reduce((n, c) => n + (c.answeredCount ?? 0), 0);
  const needsReview = clients.filter((c) => (c.answeredCount ?? 0) > 0);

  const rows: DashRow[] = clients.map((c) => {
    const done = c.totalItems - c.openCount;
    const fill = c.totalItems ? done / c.totalItems : 0;
    const isDone = c.period?.status === "closed" || (!c.openCount && c.totalItems > 0);
    const isChasing = c.period?.status === "chasing" && c.openCount > 0;

    const category: DashRow["category"] = isDone
      ? "ruled"
      : c.totalItems === 0
        ? "empty"
        : isChasing
          ? "chasing"
          : "toChase";

    const status = isDone
      ? { label: "ruled off", cls: "pill pill-success" }
      : c.openCount
        ? { label: `${c.openCount} open`, cls: "pill pill-warning" }
        : { label: "no items", cls: "pill pill-brand" };

    let activity = "No chase yet";
    let activityTone: DashRow["activityTone"] = "muted";
    if (isDone) {
      activity = "Cleared";
      activityTone = "ok";
    } else if (isChasing) {
      if (c.lastOpenedAt) {
        activity = `Opened ${timeAgo(c.lastOpenedAt)}`;
        activityTone = "ok";
      } else {
        activity = "Link not opened";
        activityTone = "warn";
      }
    }

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      books: c.qbo_realm_id ? "QuickBooks" : "manual",
      done,
      totalItems: c.totalItems,
      fill,
      category,
      statusLabel: status.label,
      statusCls: status.cls,
      activity,
      activityTone,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {justSubscribed ? (
        <div className="flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm" style={{ background: "var(--success-tint)", borderColor: "var(--success)" }}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white" style={{ background: "var(--success)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17.5 19 6.5" /></svg>
          </span>
          <span className="font-medium text-text">You are subscribed. Your 14-day free trial is running, then it is $39 a month.</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">{firm?.name ?? "Your firm"}</p>
          <h1 className="t-h2 mt-2 font-display font-semibold">The {month} close</h1>
        </div>
        <AddClientForm />
      </div>

      {clients.length === 0 ? (
        <div className="sheet px-6 py-16 text-center">
          <div className="empty-nib mb-5" aria-hidden="true">
            <span className="line" />
            <span className="nib" />
          </div>
          <p className="t-h3 font-display font-semibold">No clients yet.</p>
          <p className="mt-2 text-sm text-ink-muted">Add your first client to start a close.</p>
        </div>
      ) : (
        <>
          {/* Summary: overall progress + KPI grid */}
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,auto)_1fr]">
            <div className="sheet flex items-center gap-4 p-6">
              <ProgressRing value={overallFill} size={80} stroke={8} label={`${overallPct}%`} />
              <div>
                <div className="text-sm font-semibold text-text">of {month} ruled off</div>
                <div className="mt-0.5 text-xs text-ink-muted">
                  {totalDone} of {totalItems} item{totalItems === 1 ? "" : "s"} across {clients.length} client{clients.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Kpi value={totalOpen} label="Open items" color="#b45309" bg="var(--warning-tint)" Icon={Inbox} />
              <Kpi value={totalAnswered} label="Awaiting review" color="var(--brand)" bg="var(--brand-tint)" Icon={ClipboardCheck} />
              <Kpi value={notOpened} label="Not opened" color="var(--pending)" bg="var(--warning-tint)" Icon={EyeOff} />
              <Kpi value={ruledOff} label="Ruled off" color="var(--success)" bg="var(--success-tint)" Icon={CheckCircle2} />
            </div>
          </div>

          <ChaseEveryone count={chaseable} />

          {/* Needs your review: clients who answered and are waiting on you */}
          {needsReview.length > 0 ? (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <h2 className="t-h3 font-display font-semibold">Needs your review</h2>
                <span className="pill pill-brand num text-[11px]">{totalAnswered}</span>
              </div>
              <div className="sheet divide-y divide-line overflow-hidden">
                {needsReview.map((c) => {
                  const n = c.answeredCount ?? 0;
                  const inits = c.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                  return (
                    <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                      <Link href={`/clients/${c.id}`} className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-75">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-[13px] font-bold text-brand">
                          {inits}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-text">{c.name}</span>
                          <span className="text-xs text-ink-muted">
                            {n} answer{n === 1 ? "" : "s"} waiting on you to rule off
                          </span>
                        </span>
                      </Link>
                      {n >= 2 ? (
                        <BulkAcceptButton clientId={c.id} count={n} />
                      ) : (
                        <Link
                          href={`/clients/${c.id}`}
                          className="inline-flex items-center rounded-lg border border-line-strong px-3.5 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-2"
                        >
                          Review
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {totalOpen > 0 && <BlockingRollup rollup={rollup} />}

          <ClientsTable rows={rows} />
        </>
      )}
    </div>
  );
}
