import type { Metadata } from "next";
import Link from "next/link";
import { listClientsWithBlocking } from "@/lib/data";
import { AddClientForm } from "@/components/app/AddClientForm";
import { formatMonth, monthKey } from "@/lib/format";

export const metadata: Metadata = { title: "Clients — RuledOff" };

export default async function DashboardPage() {
  const clients = await listClientsWithBlocking();
  const month = formatMonth(monthKey());
  const totalBlocking = clients.reduce((n, c) => n + c.openCount, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Clients</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Sorted by what&apos;s most blocking the{" "}
            <span className="num">{month}</span> close.
          </p>
        </div>
        <AddClientForm />
      </div>

      {clients.length > 0 && (
        <p className="text-sm text-ink-muted">
          <span
            className="num"
            style={{ color: totalBlocking ? "var(--pending)" : "var(--cleared)" }}
          >
            {totalBlocking}
          </span>{" "}
          open item{totalBlocking === 1 ? "" : "s"} across{" "}
          <span className="num">{clients.length}</span> client
          {clients.length === 1 ? "" : "s"}.
        </p>
      )}

      {clients.length === 0 ? (
        <div className="sheet px-6 py-12 text-center">
          <p className="font-display text-xl">No clients yet.</p>
          <p className="mt-2 text-sm text-ink-muted">
            Add your first client to start a close.
          </p>
        </div>
      ) : (
        <div className="border-t" style={{ borderColor: "var(--rule)" }}>
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="ledger-row block transition-colors hover:bg-paper-deep"
            >
              <span className="flex justify-center pt-0.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    background: c.openCount
                      ? "var(--pending)"
                      : c.totalItems
                        ? "var(--cleared)"
                        : "var(--rule-strong)",
                  }}
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{c.name}</span>
                <span className="num block truncate text-xs text-ink-muted">
                  {c.email}
                  {c.qbo_realm_id ? " · QBO linked" : " · manual"}
                </span>
              </span>
              <span className="text-right">
                {c.period?.status === "closed" ? (
                  <span
                    className="num text-sm"
                    style={{ color: "var(--cleared)" }}
                  >
                    ruled off
                  </span>
                ) : c.openCount ? (
                  <span className="num text-sm" style={{ color: "var(--pending)" }}>
                    {c.openCount} open
                  </span>
                ) : c.totalItems ? (
                  <span className="num text-sm" style={{ color: "var(--cleared)" }}>
                    clear
                  </span>
                ) : (
                  <span className="num text-sm text-ink-muted">no items</span>
                )}
                {c.period?.status === "chasing" && c.openCount > 0 && (
                  <span className="block text-xs text-ink-muted">chasing</span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
