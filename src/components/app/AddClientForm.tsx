"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import { createClientAction } from "@/app/(app)/actions";
import { emptyFormState } from "@/lib/forms";

export function AddClientForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(createClientAction, emptyFormState);

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        + Add a client
      </button>
    );
  }

  return (
    <div className="sheet p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Add a client</h2>
        <button
          className="text-sm text-ink-muted hover:text-ink"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        {state.error && (
          <p
            role="alert"
            className="sm:col-span-2 text-sm"
            style={{ color: "var(--pending)" }}
          >
            {state.error}
          </p>
        )}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Name</span>
          <input name="name" required className="field" placeholder="Acme Coffee LLC" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Email</span>
          <input name="email" type="email" required className="field" placeholder="owner@acme.co" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Phone (optional)</span>
          <input name="phone" className="field num" placeholder="(555) 010-0142" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">QBO realm ID (optional)</span>
          <input name="qbo_realm_id" className="field num" placeholder="Leave blank for manual-only" />
        </label>
        <div className="sm:col-span-2">
          <SubmitButton pendingText="Adding…">Add client</SubmitButton>
        </div>
      </form>
    </div>
  );
}
