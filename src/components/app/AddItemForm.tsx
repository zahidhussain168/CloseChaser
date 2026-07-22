"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Plus, X, FileText, Receipt, ListChecks } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { SavedFlash } from "@/components/app/SavedFlash";
import { addItemAction } from "@/app/(app)/actions";
import { emptyFormState } from "@/lib/forms";

type Kind = "document" | "transaction" | "questionnaire";

const KINDS: { value: Kind; label: string; icon: typeof FileText; hint: string }[] = [
  { value: "document", label: "Document", icon: FileText, hint: "A file to upload" },
  { value: "transaction", label: "Transaction", icon: Receipt, hint: "One entry to explain" },
  { value: "questionnaire", label: "Questionnaire", icon: ListChecks, hint: "A few questions at once" },
];

export function AddItemForm({ clientId }: { clientId: string }) {
  const [state, action] = useFormState(addItemAction, emptyFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState<Kind>("document");
  const [questions, setQuestions] = useState<string[]>([""]);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setKind("document");
      setQuestions([""]);
    }
  }, [state]);

  function setQuestion(i: number, value: string) {
    setQuestions((q) => q.map((v, idx) => (idx === i ? value : v)));
  }
  function addQuestion() {
    setQuestions((q) => [...q, ""]);
  }
  function removeQuestion(i: number) {
    setQuestions((q) => (q.length === 1 ? q : q.filter((_, idx) => idx !== i)));
  }

  return (
    <form ref={formRef} action={action} className="sheet flex flex-col gap-4 p-4">
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="type" value={kind} />
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-muted">Type</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {KINDS.map((k) => {
            const active = kind === k.value;
            const Icon = k.icon;
            return (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                className={
                  "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors " +
                  (active
                    ? "border-brand bg-brand-50 dark:bg-brand-tint"
                    : "border-line-strong hover:bg-surface-2")
                }
              >
                <span
                  className={
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " +
                    (active ? "bg-brand text-white" : "bg-surface-2 text-muted")
                  }
                >
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text">{k.label}</span>
                  <span className="block text-xs text-ink-muted">{k.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">
          {kind === "questionnaire" ? "Title the client will see" : "What do you need?"}
        </span>
        <input
          name="title"
          required
          className="field"
          placeholder={
            kind === "questionnaire"
              ? "A few questions about December"
              : "December bank statement, W-9 for Acme Design"
          }
        />
      </label>

      {kind === "questionnaire" ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-ink-muted">Questions</span>
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-right text-sm font-semibold text-faint num">
                {i + 1}
              </span>
              <input
                name="question"
                value={q}
                onChange={(e) => setQuestion(i, e.target.value)}
                className="field flex-1"
                placeholder="e.g. What was the $420 charge to Staples for?"
              />
              <button
                type="button"
                onClick={() => removeQuestion(i)}
                disabled={questions.length === 1}
                aria-label={`Remove question ${i + 1}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addQuestion}
            className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-brand hover:bg-brand-50 dark:hover:bg-brand-tint"
          >
            <Plus size={15} /> Add another question
          </button>
        </div>
      ) : (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-muted">Note for the client (optional)</span>
          <input name="details" className="field" placeholder="e.g. the one ending 4821" />
        </label>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton variant="plain" pendingText="Adding…">
          Add to checklist
        </SubmitButton>
        <SavedFlash state={state} label="Added to checklist" />
      </div>
    </form>
  );
}
