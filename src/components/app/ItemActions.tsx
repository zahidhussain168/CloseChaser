"use client";

import { useTransition } from "react";
import {
  acceptItemAction,
  sendBackItemAction,
  deleteItemAction,
} from "@/app/(app)/actions";
import type { ItemState } from "@/lib/types";

export function ItemActions({
  itemId,
  clientId,
  state,
}: {
  itemId: string;
  clientId: string;
  state: ItemState;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
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
