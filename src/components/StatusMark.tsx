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
      className="mt-0.5 inline-block h-4 w-4 rounded-[3px] border"
      style={{ borderColor: "var(--rule-strong)" }}
    />
  );
}
