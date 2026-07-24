"use client";

import { useState, useTransition } from "react";
import { Send, Check, AlertCircle, ChevronDown } from "lucide-react";
import { sendTestEmailAction } from "@/app/(app)/email-actions";
import { EMAIL_KIND_LABELS, type EmailKind } from "@/lib/email/templates";

const ORDER: EmailKind[] = ["initial", "level1", "level2", "level3", "level4"];

/**
 * Sends a preview of any chase level to the bookkeeper's own inbox, branded with
 * their real accent and current wording, so they can see what a client gets.
 */
export function TestEmailButton() {
  const [kind, setKind] = useState<EmailKind>("initial");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  function send() {
    setResult(null);
    start(async () => {
      const res = await sendTestEmailAction(kind);
      setResult(
        res.ok
          ? { ok: true, text: `Sent to ${res.to}. Check your inbox.` }
          : { ok: false, text: res.error },
      );
    });
  }

  return (
    <div className="sheet flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
          <Send size={17} />
        </span>
        <div>
          <h3 className="text-[15px] font-bold text-text">See it in your inbox</h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            Send yourself a live preview of any level, branded exactly as your client sees it.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as EmailKind)}
            className="field appearance-none py-2 pl-3 pr-9 text-sm"
          >
            {ORDER.map((k) => (
              <option key={k} value={k}>
                {EMAIL_KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
        </div>
        <button
          type="button"
          onClick={send}
          disabled={pending}
          className="btn btn-primary text-sm disabled:opacity-60"
        >
          <Send size={15} /> {pending ? "Sending" : "Send test email"}
        </button>
      </div>

      {result ? (
        <div
          className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm"
          style={{
            background: result.ok ? "var(--success-tint)" : "var(--warning-tint)",
            color: result.ok ? "var(--success)" : "#b45309",
          }}
        >
          {result.ok ? <Check size={15} /> : <AlertCircle size={15} />}
          {result.text}
        </div>
      ) : null}
    </div>
  );
}
