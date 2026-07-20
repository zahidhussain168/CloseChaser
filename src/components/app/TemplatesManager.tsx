"use client";

import { useEffect, useRef, useTransition } from "react";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import {
  createTemplateAction,
  addTemplateItemAction,
  deleteTemplateItemAction,
  deleteTemplateAction,
} from "@/app/(app)/actions";
import { emptyFormState } from "@/lib/forms";
import type { RequestTemplate, TemplateItem } from "@/lib/types";

type Tpl = RequestTemplate & { items: TemplateItem[] };

export function TemplatesManager({ templates }: { templates: Tpl[] }) {
  return (
    <div className="flex flex-col gap-4">
      {templates.map((t) => (
        <TemplateCard key={t.id} template={t} />
      ))}
      {templates.length === 0 && (
        <p className="text-sm text-ink-muted">
          No templates yet. Create one below, then assign it to a client so its
          items appear automatically each month.
        </p>
      )}
      <CreateTemplate />
    </div>
  );
}

function CreateTemplate() {
  const [state, action] = useFormState(createTemplateAction, emptyFormState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="sheet flex flex-wrap items-end gap-3 p-4">
      <label className="flex flex-1 flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">New template</span>
        <input name="name" required className="field" placeholder="e.g. Monthly close basics" />
      </label>
      <SubmitButton variant="plain" pendingText="Creating…">
        Create template
      </SubmitButton>
      {state.error && (
        <p className="w-full text-sm" style={{ color: "var(--pending)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}

function TemplateCard({ template }: { template: Tpl }) {
  const [pending, start] = useTransition();
  return (
    <div className="sheet p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{template.name}</h3>
        <button
          disabled={pending}
          onClick={() => {
            if (confirm(`Delete the "${template.name}" template?`)) {
              start(() => deleteTemplateAction(template.id));
            }
          }}
          className="text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Delete template
        </button>
      </div>

      {template.items.length > 0 ? (
        <ul className="mt-3 flex flex-col divide-y" style={{ borderColor: "var(--rule)" }}>
          {template.items.map((it) => (
            <li key={it.id} className="flex items-start justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-sm">{it.title}</span>
                <span className="text-xs text-ink-muted">
                  {it.type === "document" ? "Document" : "Transaction"}
                  {it.note ? ` · ${it.note}` : ""}
                </span>
              </span>
              <button
                disabled={pending}
                onClick={() => start(() => deleteTemplateItemAction(it.id))}
                className="shrink-0 text-xs text-ink-muted hover:text-ink"
                aria-label={`Remove ${it.title}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">No items yet.</p>
      )}

      <AddTemplateItem templateId={template.id} />
    </div>
  );
}

function AddTemplateItem({ templateId }: { templateId: string }) {
  const [state, action] = useFormState(addTemplateItemAction, emptyFormState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="mt-3 flex flex-col gap-2 border-t pt-3" style={{ borderColor: "var(--rule)" }}>
      <input type="hidden" name="templateId" value={templateId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <select name="type" defaultValue="document" className="field sm:w-36">
          <option value="document">Document</option>
          <option value="transaction">Transaction</option>
        </select>
        <input name="title" required className="field flex-1" placeholder="Add an item (e.g. December bank statement)" />
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton variant="plain" pendingText="Adding…">
          Add item
        </SubmitButton>
        {state.error && (
          <span className="text-sm" style={{ color: "var(--pending)" }}>
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
