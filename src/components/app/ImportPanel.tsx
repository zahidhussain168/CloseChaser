"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { importCsvAction, importFromQboAction } from "@/app/(app)/qbo-actions";
import { emptyFormState } from "@/lib/forms";

type Result = { ok: boolean; error?: string; added?: number; skipped?: number };

function summary(r: Result): string {
  if (!r.ok) return r.error ?? "Something went wrong.";
  const added = r.added ?? 0;
  const skipped = r.skipped ?? 0;
  if (added === 0 && skipped === 0) return "Nothing new to bring in. The books are clear.";
  if (added === 0) return `Nothing new. ${skipped} already on the checklist.`;
  return `Added ${added} item${added === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} already there` : ""}.`;
}

function CsvSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn text-sm" disabled={pending}>
      {pending ? "Reading" : "Import CSV"}
    </button>
  );
}

export function ImportPanel({
  clientId,
  qboConnected,
}: {
  clientId: string;
  qboConnected: boolean;
}) {
  const [pulling, startPull] = useTransition();
  const [pullResult, setPullResult] = useState<Result | null>(null);
  const [csvState, csvAction] = useFormState<Result, FormData>(
    importCsvAction,
    emptyFormState as Result,
  );
  const [fileName, setFileName] = useState("");

  return (
    <div className="sheet p-6">
      <h3 className="text-lg">Bring in transactions</h3>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-primary text-sm"
          disabled={!qboConnected || pulling}
          onClick={() =>
            startPull(async () => setPullResult(await importFromQboAction(clientId)))
          }
        >
          {pulling ? "Pulling from QuickBooks" : "Pull from QuickBooks"}
        </button>
        {!qboConnected ? (
          <span className="text-xs text-ink-muted">
            Connect QuickBooks in Settings to enable this.
          </span>
        ) : null}
      </div>

      {pullResult ? (
        <p
          className="mt-3 text-sm"
          style={{ color: pullResult.ok ? "var(--cleared)" : "var(--pending)" }}
        >
          {summary(pullResult)}
        </p>
      ) : null}

      <form action={csvAction} className="mt-6 border-t border-rule pt-5">
        <input type="hidden" name="clientId" value={clientId} />
        <label htmlFor="csv" className="block text-sm font-medium">
          Or upload a CSV export
        </label>
        <p className="mt-1 text-xs text-ink-muted">
          Export the transactions from QuickBooks and drop the file here. Works
          without connecting anything.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            id="csv"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            className="block max-w-full text-sm file:mr-3 file:min-h-[40px] file:cursor-pointer file:rounded-[7px] file:border file:border-rule-strong file:bg-paper-sheet file:px-4 file:text-sm file:font-semibold"
          />
          <CsvSubmit />
        </div>
        {fileName ? (
          <p className="mt-2 num text-xs text-ink-muted">{fileName}</p>
        ) : null}
        {csvState.ok || csvState.error ? (
          <p
            className="mt-3 text-sm"
            style={{ color: csvState.ok ? "var(--cleared)" : "var(--pending)" }}
          >
            {summary(csvState)}
          </p>
        ) : null}
      </form>
    </div>
  );
}
