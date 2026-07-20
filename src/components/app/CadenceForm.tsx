"use client";

import { useFormState } from "react-dom";
import { updateCadenceAction } from "@/app/(app)/actions";
import { emptyFormState } from "@/lib/forms";

/**
 * When reminders go out. The wording of each level is edited separately, below
 * this on the settings page, because the escalation is carried by the copy.
 */
export function CadenceForm({
  offsets,
  weeklyStep,
}: {
  offsets: number[];
  weeklyStep: number;
}) {
  const [state, action] = useFormState(updateCadenceAction, emptyFormState);

  const preview = [...offsets]
    .sort((a, b) => a - b)
    .map((d) => `day ${d}`)
    .join(", ");

  return (
    <form action={action} className="sheet flex flex-col gap-4 p-6">
      <div>
        <label htmlFor="offsets" className="block text-sm font-medium">
          Remind on these days
        </label>
        <p className="mt-1 text-xs text-ink-muted">
          Counted from the day you start the chase. Separate with commas.
        </p>
        <input
          id="offsets"
          name="offsets"
          className="field num mt-2"
          defaultValue={offsets.join(", ")}
          placeholder="2, 5, 9"
        />
      </div>

      <div>
        <label htmlFor="weeklyStep" className="block text-sm font-medium">
          Then every
        </label>
        <p className="mt-1 text-xs text-ink-muted">
          Once those are used up, keep nudging on this interval until the items
          come in.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            id="weeklyStep"
            name="weeklyStep"
            type="number"
            min={3}
            max={30}
            className="field num max-w-[7rem]"
            defaultValue={weeklyStep}
          />
          <span className="text-sm text-ink-muted">days</span>
        </div>
      </div>

      <p className="border-t border-rule pt-4 text-sm text-ink-muted">
        Currently: {preview}, then every {weeklyStep} days. Reminders stop the
        moment every item is answered.
      </p>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary text-sm">
          Save cadence
        </button>
        {state.ok ? (
          <span className="text-sm" style={{ color: "var(--cleared)" }}>
            Saved.
          </span>
        ) : null}
        {state.error ? (
          <span className="text-sm" style={{ color: "var(--pending)" }}>
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
