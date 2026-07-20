"use client";

import { useTransition } from "react";
import { disconnectQboAction } from "@/app/(app)/qbo-actions";

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
    <div className="sheet p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg">QuickBooks Online</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Pull uncategorized charges and Ask My Accountant entries straight into
            a client&apos;s checklist.
          </p>
        </div>
        {connected ? (
          <form
            action={() => start(() => void disconnectQboAction())}
            className="shrink-0"
          >
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
        <p
          className="mt-4 text-sm"
          style={{
            color: message.tone === "cleared" ? "var(--cleared)" : "var(--pending)",
          }}
        >
          {message.text}
        </p>
      ) : null}

      {connected ? (
        <dl className="mt-5 border-t border-rule pt-4 text-sm">
          <div className="flex justify-between py-1">
            <dt className="text-ink-muted">Company</dt>
            <dd>{companyName || "Connected company"}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-ink-muted">Realm</dt>
            <dd className="num text-xs">{realmId}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-xs text-ink-muted">
          No QuickBooks yet? You can still upload a CSV export on any client page.
        </p>
      )}
    </div>
  );
}
