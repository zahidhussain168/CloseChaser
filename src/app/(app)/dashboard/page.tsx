import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { listClientsWithBlocking, getFirm, getCloseRollup } from "@/lib/data";
import { AddClientForm } from "@/components/app/AddClientForm";
import { BlockingRollup } from "@/components/app/BlockingRollup";
import { Counter } from "@/components/marketing/Counter";
import { ProgressRing } from "@/components/site/ProgressRing";
import { formatMonth, monthKey, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Clients · RuledOff" };

function Stat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div>
      <Counter to={value} className="num block text-3xl font-bold" style={{ color }} />
      <div className="mt-0.5 text-xs text-ink-muted">{label}</div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { subscribed?: string };
}) {
  const [clients, firm] = await Promise.all([
    listClientsWithBlocking(),
    getFirm(),
  ]);
  const month = formatMonth(monthKey());
  const justSubscribed = searchParams.subscribed === "1";

  const totalOpen = clients.reduce((n, c) => n + c.openCount, 0);
  const chasing = clients.filter((c) => c.period?.status === "chasing").length;
  const ruledOff = clients.filter((c) => c.period?.status === "closed").length;
  const totalItems = clients.reduce((n, c) => n + c.totalItems, 0);
  const totalDone = clients.reduce((n, c) => n + (c.totalItems - c.openCount), 0);
  const overallFill = totalItems ? totalDone / totalItems : 0;
  const overallPct = Math.round(overallFill * 100);
  const rollup = await getCloseRollup(clients);

  return (
    <div className="flex flex-col gap-6">
      {justSubscribed ? (
        <div
          className="flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm"
          style={{ background: "var(--success-tint)", borderColor: "var(--success)" }}
        >
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: "var(--success)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17.5 19 6.5" /></svg>
          </span>
          <span className="font-medium text-text">
            You are subscribed. Your 14-day free trial is running, then it is $29 a month.
          </span>
        </div>
      ) : null}

      {/* Header */}
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
          <p className="mt-2 text-sm text-ink-muted">
            Add your first client to start a close.
          </p>
        </div>
      ) : (
        <>
          {/* The month, at a glance */}
          <div className="sheet flex flex-wrap items-center gap-x-8 gap-y-5 p-6">
            <div className="flex items-center gap-4">
              <ProgressRing value={overallFill} size={84} stroke={8} label={`${overallPct}%`} />
              <div>
                <div className="text-sm font-semibold text-text">of {month} ruled off</div>
                <div className="mt-0.5 text-xs text-ink-muted">
                  {totalDone} of {totalItems} item{totalItems === 1 ? "" : "s"} across {clients.length} client{clients.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-7 border-l border-line pl-7 sm:gap-9 sm:pl-9">
              <Stat value={totalOpen} label="Open items" color={totalOpen ? "var(--warning)" : "var(--success)"} />
              <Stat value={chasing} label="Chasing" color="var(--brand)" />
              <Stat value={ruledOff} label="Ruled off" color="var(--success)" />
            </div>
          </div>

          {/* Needs you this week */}
          {totalOpen > 0 && <BlockingRollup rollup={rollup} />}

          {/* Clients */}
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="t-h3 font-display font-semibold">Clients</h2>
              <span className="num text-xs text-ink-muted">
                sorted by what is blocking · {clients.length} client{clients.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {clients.map((c) => {
                const done = c.totalItems - c.openCount;
                const fill = c.totalItems ? done / c.totalItems : 0;
                const isDone = c.period?.status === "closed" || (!c.openCount && c.totalItems);
                const st = isDone
                  ? { pill: "pill pill-success", label: "ruled off", tint: "var(--success-tint)", ink: "var(--success)" }
                  : c.openCount
                    ? { pill: "pill pill-warning", label: `${c.openCount} open`, tint: "var(--warning-tint)", ink: "#b45309" }
                    : { pill: "pill pill-brand", label: "no items", tint: "var(--brand-tint)", ink: "var(--brand-darker)" };
                const initials = c.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

                return (
                  <Link
                    key={c.id}
                    href={`/clients/${c.id}`}
                    className="sheet lift flex items-center gap-4 p-4"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold"
                      style={{ background: st.tint, color: st.ink }}
                    >
                      {initials}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-text">{c.name}</span>
                      <span className="num block truncate text-xs text-ink-muted">
                        {c.email}
                        {c.qbo_realm_id ? " · QuickBooks" : " · manual"}
                      </span>
                      {c.period?.status === "chasing" && c.openCount > 0 ? (
                        <span className="mt-1 flex items-center gap-1.5 text-[11px]">
                          <span
                            aria-hidden="true"
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{ background: c.lastOpenedAt ? "var(--cleared)" : "var(--pending)" }}
                          />
                          <span style={{ color: c.lastOpenedAt ? "var(--ink-muted)" : "var(--pending)" }}>
                            {c.lastOpenedAt ? `Opened ${timeAgo(c.lastOpenedAt)}` : "Link not opened yet"}
                          </span>
                        </span>
                      ) : null}
                    </span>

                    {c.totalItems > 0 ? (
                      <span className="hidden w-32 items-center gap-2 sm:flex">
                        <span
                          className="ink-progress block flex-1"
                          style={{ ["--fill"]: fill } as CSSProperties}
                          aria-hidden="true"
                        >
                          <span />
                        </span>
                        <span className="num text-[11px] text-ink-muted">
                          {done}/{c.totalItems}
                        </span>
                      </span>
                    ) : null}

                    <span className="flex justify-end">
                      <span className={st.pill + " num"}>{st.label}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
