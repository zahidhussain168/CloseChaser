"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { Check, Plus, Sparkles } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { SavedFlash } from "@/components/app/SavedFlash";
import {
  createTemplateAction,
  addTemplateItemAction,
  deleteTemplateItemAction,
  deleteTemplateAction,
  addStarterTemplateAction,
} from "@/app/(app)/actions";
import { emptyFormState } from "@/lib/forms";
import { STARTER_TEMPLATES } from "@/lib/seasonalTemplates";
import type { RequestTemplate, TemplateItem } from "@/lib/types";

type Tpl = RequestTemplate & { items: TemplateItem[] };

export function TemplatesManager({ templates }: { templates: Tpl[] }) {
  const existingNames = new Set(templates.map((t) => t.name.toLowerCase()));
  return (
    <div className="flex flex-col gap-4">
      <StarterPacks existingNames={existingNames} />

      {templates.map((t) => (
        <TemplateCard key={t.id} template={t} />
      ))}
      {templates.length === 0 && (
        <p className="text-sm text-ink-muted">
          No templates yet. Add a starter pack above, or build your own below,
          then assign it to a client so its items appear automatically each month.
        </p>
      )}
      <CreateTemplate />
    </div>
  );
}

function StarterPacks({ existingNames }: { existingNames: Set<string> }) {
  const [pending, start] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function add(key: string) {
    setError(null);
    setBusyKey(key);
    start(async () => {
      const res = await addStarterTemplateAction(key);
      if (!res.ok) setError(res.error ?? "Could not add that pack.");
      setBusyKey(null);
    });
  }

  return (
    <div className="sheet p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand dark:bg-brand-tint">
          <Sparkles size={18} />
        </span>
        <div>
          <h3 className="text-[15px] font-bold text-text">Starter packs</h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            Ready-made lists for the moments that repeat. Add one, then edit or
            trim any item to fit how you work.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STARTER_TEMPLATES.map((pack) => {
          const added = existingNames.has(pack.name.toLowerCase());
          const busy = pending && busyKey === pack.key;
          return (
            <div
              key={pack.key}
              className="flex flex-col rounded-xl border border-line bg-surface-2/40 p-4"
            >
              <span className="pill pill-brand w-fit text-[11px]">{pack.season}</span>
              <h4 className="mt-2 text-sm font-semibold text-text">{pack.name}</h4>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-muted">
                {pack.blurb}
              </p>
              <p className="num mt-2 text-xs text-faint">
                {pack.items.length} item{pack.items.length === 1 ? "" : "s"}
              </p>
              <button
                type="button"
                onClick={() => add(pack.key)}
                disabled={added || busy}
                className={
                  "mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                  (added
                    ? "cursor-default bg-cleared-soft text-success"
                    : "bg-brand text-white hover:bg-brand-600 disabled:opacity-60")
                }
              >
                {added ? (
                  <>
                    <Check size={15} /> Added
                  </>
                ) : busy ? (
                  "Adding…"
                ) : (
                  <>
                    <Plus size={15} /> Add pack
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
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
      <SavedFlash state={state} label="Template created" />
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
        <SavedFlash state={state} label="Item added" />
        {state.error && (
          <span className="text-sm" style={{ color: "var(--pending)" }}>
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
