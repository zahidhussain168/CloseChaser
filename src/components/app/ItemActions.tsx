"use client";

import { useTransition } from "react";
import {
  acceptItemAction,
  sendBackItemAction,
  deleteItemAction,
  retryQboSyncAction,
} from "@/app/(app)/actions";
import type { ItemState } from "@/lib/types";

export function ItemActions({
  itemId,
  clientId,
  state,
  qboSyncedAt,
  qboSyncError,
}: {
  itemId: string;
  clientId: string;
  state: ItemState;
  /** Only set for items that came from QuickBooks. */
  qboSyncedAt?: string | null;
  qboSyncError?: string | null;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
      {qboSyncError ? (
        <span className="flex flex-wrap items-center gap-2">
          <span style={{ color: "var(--pending)" }}>
            QuickBooks did not take this: {qboSyncError}
          </span>
          <button
            disabled={pending}
            onClick={() => start(() => retryQboSyncAction(itemId, clientId))}
            className="underline underline-offset-2"
          >
            {pending ? "Retrying" : "Retry"}
          </button>
        </span>
      ) : qboSyncedAt ? (
        <span className="num text-xs" style={{ color: "var(--cleared)" }}>
          Written back to QuickBooks
        </span>
      ) : null}
      {state === "answered" && (
        <>
          <button
            disabled={pending}
            onClick={() => start(() => acceptItemAction(itemId, clientId))}
            className="btn btn-primary px-3 py-1.5 text-sm"
          >
            Rule it off
          </button>
          <button
            disabled={pending}
            onClick={() => start(() => sendBackItemAction(itemId, clientId))}
            className="text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Send back
          </button>
        </>
      )}
      {state !== "accepted" && (
        <button
          disabled={pending}
          onClick={() => {
            if (confirm("Remove this item?")) {
              start(() => deleteItemAction(itemId, clientId));
            }
          }}
          className="text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Remove
        </button>
      )}
    </div>
  );
}
