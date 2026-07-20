import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { listClientsWithBlocking, getFirm, getCloseRollup } from "@/lib/data";
import { AddClientForm } from "@/components/app/AddClientForm";
import { BlockingRollup } from "@/components/app/BlockingRollup";
import { Counter } from "@/components/marketing/Counter";
import { formatMonth, monthKey, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Clients · RuledOff" };

function StatCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone: "pending" | "cleared" | "ink";
  hint: string;
}) {
  const color =
    tone === "pending"
      ? "var(--pending)"
      : tone === "cleared"
        ? "var(--cleared)"
        : "var(--ink)";
  return (
    <div className="sheet spot flex flex-col justify-between p-5">
      <div className="text-xs uppercase tracking-widest text-ink-muted">
        {label}
      </div>
      <Counter
        to={value}
        className="num mt-3 block text-4xl"
        style={{ color: value === 0 && tone === "pending" ? "var(--cleared)" : color }}
      />
      <div className="mt-1 text-xs text-ink-muted">{hint}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const [clients, firm] = await Promise.all([
    listClientsWithBlocking(),
    getFirm(),
  ]);
  const month = formatMonth(monthKey());

  const totalOpen = clients.reduce((n, c) => n + c.openCount, 0);
  const chasing = clients.filter((c) => c.period?.status === "chasing").length;
  const ruledOff = clients.filter((c) => c.period?.status === "closed").length;
  const rollup = await getCloseRollup(clients);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">{firm?.name ?? "Your firm"}</p>
          <h1 className="t-h2 mt-2 font-display font-semibold">
            The {month} close
          </h1>
        </div>
        <AddClientForm />
      </div>

      {clients.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Open items"
            value={totalOpen}
            tone="pending"
            hint={totalOpen ? "waiting on clients" : "nothing blocking"}
          />
          <StatCard
            label="Chasing"
            value={chasing}
            tone="ink"
            hint={`client${chasing === 1 ? "" : "s"} being reminded`}
          />
          <StatCard
            label="Ruled off"
            value={ruledOff}
            tone="cleared"
            hint={`closed this month`}
          />
        </div>
      )}

      {totalOpen > 0 && <BlockingRollup rollup={rollup} />}

      {clients.length === 0 ? (
        <div className="sheet px-6 py-14 text-center">
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
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="t-h3 font-display font-semibold">
              Sorted by most blocking
            </h2>
            <span className="num text-xs text-ink-muted">
              {clients.length} client{clients.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="sheet overflow-hidden">
            {/* column header */}
            <div
              className="grid grid-cols-[1.5rem_1fr_10rem_5rem] items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-widest text-ink-muted"
              style={{ borderBottom: "2px solid var(--rule)" }}
            >
              <span />
              <span>Client</span>
              <span className="hidden sm:block">Progress</span>
              <span className="text-right">Status</span>
            </div>

            {clients.map((c, idx) => {
              const done = c.totalItems - c.openCount;
              const fill = c.totalItems ? done / c.totalItems : 0;
              const label =
                c.period?.status === "closed"
                  ? "ruled off"
                  : c.openCount
                    ? `${c.openCount} open`
                    : c.totalItems
                      ? "clear"
                      : "no items";
              const tone =
                c.period?.status === "closed" || (!c.openCount && c.totalItems)
                  ? "var(--cleared)"
                  : c.openCount
                    ? "var(--pending)"
                    : "var(--ink-muted)";
              return (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  className="reveal-row grid grid-cols-[1.5rem_1fr_10rem_5rem] items-center gap-3 px-4"
                  style={{ ["--i"]: idx } as CSSProperties}
                >
                  <span className="flex justify-center">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: tone }}
                    />
                  </span>
                  <span className="min-w-0 py-4">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="num block truncate text-xs text-ink-muted">
                      {c.email}
                      {c.qbo_realm_id ? " · QBO linked" : " · manual"}
                    </span>
                    {c.period?.status === "chasing" && c.openCount > 0 && (
                      <span className="mt-1 flex items-center gap-1.5 text-[11px]">
                        <span
                          aria-hidden="true"
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{
                            background: c.lastOpenedAt
                              ? "var(--cleared)"
                              : "var(--pending)",
                          }}
                        />
                        <span
                          style={{
                            color: c.lastOpenedAt
                              ? "var(--ink-muted)"
                              : "var(--pending)",
                          }}
                        >
                          {c.lastOpenedAt
                            ? `Opened ${timeAgo(c.lastOpenedAt)}`
                            : "Link not opened yet"}
                        </span>
                      </span>
                    )}
                  </span>
                  <span className="hidden sm:block">
                    {c.totalItems > 0 ? (
                      <span className="flex items-center gap-2">
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
                    ) : (
                      <span className="num text-[11px] text-ink-muted">
                        no items
                      </span>
                    )}
                  </span>
                  <span
                    className="num text-right text-sm"
                    style={{ color: tone }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
