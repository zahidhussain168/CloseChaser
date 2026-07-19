"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import { addItemAction } from "@/app/(app)/actions";
import { emptyFormState } from "@/lib/forms";

export function AddItemForm({ clientId }: { clientId: string }) {
  const [state, action] = useFormState(addItemAction, emptyFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="sheet flex flex-col gap-3 p-4"
    >
      <input type="hidden" name="clientId" value={clientId} />
      {state.error && (
        <p role="alert" className="text-sm" style={{ color: "var(--pending)" }}>
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-col gap-1.5 text-sm sm:w-40">
          <span className="text-ink-muted">Type</span>
          <select name="type" className="field" defaultValue="document">
            <option value="document">Document</option>
            <option value="transaction">Transaction</option>
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">What do you need?</span>
          <input
            name="title"
            required
            className="field"
            placeholder="December bank statement · W-9 for Acme Design"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Note for the client (optional)</span>
        <input
          name="details"
          className="field"
          placeholder="e.g. the one ending 4821"
        />
      </label>
      <div>
        <SubmitButton variant="plain" pendingText="Adding…">
          Add to checklist
        </SubmitButton>
      </div>
    </form>
  );
}
