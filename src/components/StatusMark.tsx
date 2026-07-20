import { HandCheck } from "@/components/HandCheck";
import type { ItemState } from "@/lib/types";

/**
 * The ledger "tick column" mark.
 *  requested/nudged → an empty ruled box (still owed)
 *  answered         → a brass check (client did their part, awaiting accept)
 *  accepted         → a deep-green hand-drawn check (ruled off)
 */
export function StatusMark({
  state,
  animate = false,
}: {
  state: ItemState;
  animate?: boolean;
}) {
  if (state === "accepted") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center">
        <HandCheck color="var(--cleared)" animate={animate} />
      </span>
    );
  }
  if (state === "answered") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center">
        <HandCheck color="var(--brass)" animate={animate} />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border-2"
      style={{ borderColor: "var(--border-strong)" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--faint)" }} />
    </span>
  );
}
