"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { Pencil } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { updateClientAction } from "@/app/(app)/client-actions";
import { emptyFormState } from "@/lib/forms";

type EditableClient = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
};

export function ClientEditForm({ client }: { client: EditableClient }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(updateClientAction, emptyFormState);
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <Pencil size={14} /> Edit client
      </button>
    );
  }

  return (
    <form action={action} className="sheet flex flex-col gap-3 p-4">
      <input type="hidden" name="clientId" value={client.id} />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">Name</span>
          <input name="name" defaultValue={client.name} required className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">Email</span>
          <input name="email" type="email" defaultValue={client.email} required className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">Phone</span>
          <input name="phone" defaultValue={client.phone ?? ""} className="field num" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink-muted">Private notes (only you see these)</span>
        <textarea
          name="notes"
          defaultValue={client.notes ?? ""}
          rows={2}
          className="field"
          placeholder="e.g. always slow, call rather than email"
        />
      </label>
      <div className="flex items-center gap-3">
        <SubmitButton variant="plain" pendingText="Saving">
          Save
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-ink-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
