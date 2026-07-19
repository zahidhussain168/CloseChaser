"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import {
  updateBrandingAction,
  updateTemplateAction,
} from "@/app/(app)/actions";
import { emptyFormState } from "@/lib/forms";
import {
  EMAIL_KIND_LABELS,
  type EmailKind,
} from "@/lib/email/templates";

function Saved({ ok }: { ok: boolean }) {
  if (!ok) return null;
  return (
    <span className="text-sm" style={{ color: "var(--cleared)" }}>
      Saved
    </span>
  );
}

export function BrandingForm({
  name,
  accentColor,
  replyTo,
}: {
  name: string;
  accentColor: string;
  replyTo: string;
}) {
  const [state, action] = useFormState(updateBrandingAction, emptyFormState);
  return (
    <form action={action} className="sheet flex flex-col gap-4 p-5">
      {state.error && (
        <p className="text-sm" style={{ color: "var(--pending)" }}>
          {state.error}
        </p>
      )}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Firm name (clients see this)</span>
        <input name="name" defaultValue={name} required className="field" />
      </label>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Accent colour</span>
          <input
            name="accent_color"
            type="color"
            defaultValue={accentColor}
            className="h-11 w-20 rounded-[6px] border"
            style={{ borderColor: "var(--rule-strong)" }}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Reply-to email (optional)</span>
          <input
            name="reply_to"
            type="email"
            defaultValue={replyTo}
            className="field"
            placeholder="you@yourfirm.com"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Saving…">Save branding</SubmitButton>
        <Saved ok={state.ok} />
      </div>
    </form>
  );
}

export function TemplateEditor({
  kind,
  subject,
  body,
}: {
  kind: EmailKind;
  subject: string;
  body: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(updateTemplateAction, emptyFormState);

  return (
    <div className="sheet p-4">
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-medium">{EMAIL_KIND_LABELS[kind]}</span>
        <span className="text-sm text-ink-muted">{open ? "Close" : "Edit"}</span>
      </button>
      {open && (
        <form action={action} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="kind" value={kind} />
          {state.error && (
            <p className="text-sm" style={{ color: "var(--pending)" }}>
              {state.error}
            </p>
          )}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-muted">Subject</span>
            <input name="subject" defaultValue={subject} required className="field" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-muted">Body</span>
            <textarea
              name="body"
              defaultValue={body}
              required
              rows={8}
              className="field"
            />
          </label>
          <p className="text-xs text-ink-muted">
            Tokens:{" "}
            <span className="num">
              {"{{firstName}} {{firmName}} {{month}} {{openCount}} {{deadline}}"}
            </span>
          </p>
          <div className="flex items-center gap-3">
            <SubmitButton variant="plain" pendingText="Saving…">
              Save
            </SubmitButton>
            <Saved ok={state.ok} />
          </div>
        </form>
      )}
    </div>
  );
}
