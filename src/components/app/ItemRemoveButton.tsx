"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteItemAction } from "@/app/(app)/actions";

/**
 * A quiet remove control: an icon that stays out of the way (revealed on row
 * hover on desktop, always tappable on touch) so the checklist reads cleanly.
 */
export function ItemRemoveButton({ itemId, clientId }: { itemId: string; clientId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Remove item"
      title="Remove"
      onClick={() => {
        if (confirm("Remove this item?")) start(() => deleteItemAction(itemId, clientId));
      }}
      className="rounded-md p-1 text-faint opacity-100 transition-colors hover:bg-surface-2 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
    >
      <Trash2 size={15} />
    </button>
  );
}
