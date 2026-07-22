"use client";

import { useState, useTransition } from "react";
import { CheckCheck, CalendarPlus } from "lucide-react";
import { bulkAcceptAction, copyLastMonthAction } from "@/app/(app)/client-actions";

/** Rule off every answered item at once (shown when items come back in a batch). */
export function BulkAcceptButton({ clientId, count }: { clientId: string; count: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await bulkAcceptAction(clientId); })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
    >
      <CheckCheck size={15} /> {pending ? "Ruling off" : `Rule off all ${count}`}
    </button>
  );
}

/** Repopulate this month's close from last month's manual requests. */
export function CopyLastMonthButton({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const r = await copyLastMonthAction(clientId);
            setMsg(r.ok ? null : r.error ?? "Could not copy");
          })
        }
        className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-surface-2 disabled:opacity-60"
      >
        <CalendarPlus size={15} /> {pending ? "Copying" : "Copy last month"}
      </button>
      {msg && <span className="text-xs text-ink-muted">{msg}</span>}
    </span>
  );
}
