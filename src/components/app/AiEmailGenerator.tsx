"use client";

import { useState, useTransition } from "react";
import { Sparkles, Check, RefreshCw } from "lucide-react";
import {
  generateChaseEmailsAction,
  saveChaseEmailsAction,
  type GenerateResult,
} from "@/app/(app)/ai-actions";
import type { GeneratedSet } from "@/lib/ai/emails";
import { EmailPreview } from "@/components/app/EmailPreview";

const LABELS: Record<string, string> = {
  initial: "First chase",
  level1: "Reminder 1, friendly",
  level2: "Reminder 2, specific",
  level3: "Reminder 3, consequence",
  level4: "Reminder 4, weekly",
};
const ORDER = ["initial", "level1", "level2", "level3", "level4"] as const;
const TONES = ["Warm", "Balanced", "Firm"] as const;

export function AiEmailGenerator({
  configured,
  firmName,
  accent,
  pro,
}: {
  configured: boolean;
  firmName: string;
  accent: string;
  pro: boolean;
}) {
  const [voice, setVoice] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Warm");
  const [generated, setGenerated] = useState<GeneratedSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [gen, startGen] = useTransition();
  const [save, startSave] = useTransition();

  function generate() {
    setError(null);
    setSaved(false);
    startGen(async () => {
      const res: GenerateResult = await generateChaseEmailsAction(voice, tone);
      if (res.ok) setGenerated(res.templates);
      else setError(res.error);
    });
  }

  function useThese() {
    if (!generated) return;
    startSave(async () => {
      const res = await saveChaseEmailsAction(generated);
      if (res.ok) setSaved(true);
      else setError(res.error ?? "Could not save the emails.");
    });
  }

  return (
    <div className="sheet overflow-hidden">
      {/* Gradient header signals this is the AI writer */}
      <div
        className="flex items-start gap-3 border-b border-line px-5 py-4"
        style={{ background: "linear-gradient(180deg, var(--brand-tint), transparent 170%)" }}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-brand"
          style={{ background: "linear-gradient(135deg, var(--brand), var(--brass))" }}
        >
          <Sparkles size={19} />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-text">Write them in your voice</h3>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: "var(--surface-2)", color: "var(--brass-ink)" }}>
              <Sparkles size={10} /> AI
            </span>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">
            Describe how you talk to clients, or paste an email you already send. RuledOff writes
            all five reminders for you, from the first friendly ask to the final nudge.
          </p>
        </div>
      </div>

      <div className="p-5">
        <label className="mb-1.5 block text-sm font-medium text-ink-muted">Your voice</label>
        <textarea
          className="field min-h-[96px] resize-y"
          placeholder="e.g. Warm and casual, I sign off as Sarah. I like to keep it short and thank them for their time."
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          disabled={!configured}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-ink-muted">Tone</span>
            <div className="flex gap-0.5 rounded-lg bg-surface-2 p-0.5">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={!configured}
                  onClick={() => setTone(t)}
                  className={
                    "rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors " +
                    (tone === t ? "bg-surface text-text shadow-sm" : "text-ink-muted hover:text-text")
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={!configured || gen}
            className="btn btn-primary text-sm disabled:opacity-60"
          >
            {gen ? "Writing" : generated ? <><RefreshCw size={15} /> Regenerate</> : <><Sparkles size={15} /> Generate</>}
          </button>
        </div>

        {!configured ? (
          <p className="mt-3 text-xs text-ink-muted">AI writing is not configured yet.</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      {generated ? (
        <div className="mt-5 border-t border-line pt-5">
          <div className="grid gap-4 lg:grid-cols-2">
            {ORDER.map((kind) => (
              <div key={kind}>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                  {LABELS[kind]}
                </div>
                {pro ? (
                  <EmailPreview
                    subject={generated[kind].subject}
                    body={generated[kind].body}
                    firmName={firmName}
                    accent={accent}
                  />
                ) : (
                  <div className="rounded-xl border border-line bg-surface-2/50 p-4">
                    <div className="text-sm font-semibold text-text">{generated[kind].subject}</div>
                    <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted">
                      {generated[kind].body}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={useThese}
              disabled={save || saved}
              className="btn btn-primary text-sm"
            >
              {saved ? <><Check size={15} /> Saved</> : save ? "Saving" : "Use these emails"}
            </button>
            {saved ? (
              <span className="text-sm text-ink-muted">
                Your reminders now use this wording. Fine-tune any one below.
              </span>
            ) : (
              <span className="text-xs text-ink-muted">
                Review them, then save. You can still tweak each one below.
              </span>
            )}
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
