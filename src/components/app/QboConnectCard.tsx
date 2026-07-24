"use client";

import { useTransition } from "react";
import { Check, AlertCircle } from "lucide-react";
import { disconnectQboAction } from "@/app/(app)/qbo-actions";
import { BrandLogo } from "@/components/app/BrandLogo";

export function QboConnectCard({
  connected,
  companyName,
  realmId,
  status,
  detail,
}: {
  connected: boolean;
  companyName: string | null;
  realmId: string | null;
  status?: string;
  detail?: string;
}) {
  const [pending, start] = useTransition();

  const message =
    status === "connected"
      ? { tone: "cleared", text: "QuickBooks is connected." }
      : status === "declined"
        ? { tone: "pending", text: "You cancelled the QuickBooks connection." }
        : status === "error"
          ? { tone: "pending", text: detail || "Could not connect QuickBooks." }
          : null;

  return (
    <div className="sheet overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="flex items-start gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-white p-1.5 shadow-sm">
            <BrandLogo brand="quickbooks" className="h-full w-full" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-bold text-text">QuickBooks Online</h3>
              {connected ? (
                <span className="pill pill-success text-[11px]">
                  <Check size={12} /> Connected
                </span>
              ) : (
                <span className="pill pill-brand text-[11px]">Not connected</span>
              )}
            </div>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-muted">
              Pull uncategorized charges and Ask My Accountant entries straight into
              a client&apos;s checklist.
            </p>
          </div>
        </div>
        {connected ? (
          <form action={() => start(() => void disconnectQboAction())} className="shrink-0">
            <button type="submit" className="btn text-sm" disabled={pending}>
              {pending ? "Disconnecting" : "Disconnect"}
            </button>
          </form>
        ) : (
          <a href="/api/qbo/connect" className="btn btn-primary shrink-0 text-sm">
            Connect QuickBooks
          </a>
        )}
      </div>

      {message ? (
        <div
          className="mx-6 mb-1 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm"
          style={{
            background: message.tone === "cleared" ? "var(--success-tint)" : "var(--warning-tint)",
            color: message.tone === "cleared" ? "var(--success)" : "#b45309",
          }}
        >
          {message.tone === "cleared" ? <Check size={15} /> : <AlertCircle size={15} />}
          {message.text}
        </div>
      ) : null}

      {connected ? (
        <div className="grid grid-cols-2 gap-px border-t border-line bg-line">
          <div className="bg-surface px-6 py-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-faint">Company</div>
            <div className="mt-0.5 truncate text-sm font-medium text-text">{companyName || "Connected company"}</div>
          </div>
          <div className="bg-surface px-6 py-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-faint">Realm ID</div>
            <div className="num mt-0.5 truncate text-sm text-ink-muted">{realmId}</div>
          </div>
        </div>
      ) : (
        <div className="border-t border-line bg-surface-2/40 px-6 py-3.5 text-[13px] text-ink-muted">
          No QuickBooks yet? You can still upload a CSV export on any client page.
        </div>
      )}
    </div>
  );
}
