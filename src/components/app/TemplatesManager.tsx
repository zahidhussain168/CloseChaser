"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { Check, Plus, Sparkles, LayoutList, FileText, Receipt, Trash2, X } from "lucide-react";
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
    <form
      ref={ref}
      action={action}
      className="sheet flex flex-col gap-4 border-dashed p-5"
      style={{ borderColor: "var(--line-strong)" }}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
          <Plus size={18} />
        </span>
        <div>
          <h3 className="text-[15px] font-bold text-text">Create a template</h3>
          <p className="mt-0.5 text-sm text-ink-muted">Start a blank list, then add the items you request each month.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink-muted">Template name</span>
          <input name="name" required className="field" placeholder="e.g. Monthly close basics" />
        </label>
        <SubmitButton variant="plain" pendingText="Creating…">
          Create template
        </SubmitButton>
      </div>
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
  const n = template.items.length;
  return (
    <div className="sheet overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
            <LayoutList size={19} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-[16px] font-semibold text-text">{template.name}</h3>
            <span className="num text-xs text-faint">
              {n} item{n === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(`Delete the "${template.name}" template?`)) {
              start(() => deleteTemplateAction(template.id));
            }
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-danger-tint hover:text-danger"
          aria-label="Delete template"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {n > 0 ? (
        <ul className="divide-y divide-line px-5">
          {template.items.map((it) => (
            <li key={it.id} className="group flex items-center gap-3 py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-muted">
                {it.type === "document" ? <FileText size={14} /> : <Receipt size={14} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-text">{it.title}</span>
                <span className="text-xs text-faint">
                  {it.type === "document" ? "Document" : "Transaction"}
                  {it.note ? ` · ${it.note}` : ""}
                </span>
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => start(() => deleteTemplateItemAction(it.id))}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-faint opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                aria-label={`Remove ${it.title}`}
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-ink-muted">No items yet. Add the first below.</p>
      )}

      <div className="border-t border-line bg-surface-2/30 px-5 py-3.5">
        <AddTemplateItem templateId={template.id} />
      </div>
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
    <form ref={ref} action={action} className="flex flex-col gap-2">
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
