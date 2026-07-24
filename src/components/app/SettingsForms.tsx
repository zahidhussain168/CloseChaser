"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { ChevronDown, Eye } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { EmailPreview } from "@/components/app/EmailPreview";
import { ProLockOverlay } from "@/components/app/ProLock";
import {
  updateBrandingAction,
  updateTemplateAction,
} from "@/app/(app)/actions";
import { emptyFormState } from "@/lib/forms";
import { initials, readableOn } from "@/lib/format";
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

/** A few tasteful, high-contrast presets so most firms never touch the picker. */
const ACCENT_PRESETS = [
  { name: "Brass", hex: "#C49A2A" },
  { name: "Teal", hex: "#0EA5E9" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Indigo", hex: "#4F46E5" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Rose", hex: "#E11D48" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Slate", hex: "#475569" },
];

/**
 * The live preview is the whole point: the accent is abstract until you see it
 * on the thing your client actually opens. So we render a miniature of the
 * client link and the reminder-email header, both recolouring as you pick.
 */
function BrandPreview({ name, accent }: { name: string; accent: string }) {
  const on = readableOn(accent);
  const firm = name.trim() || "Your firm";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Client link mock */}
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">The client link</div>
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="h-1.5 w-full" style={{ background: accent }} />
          <div className="p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: accent, color: on }}>
                {initials(firm)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-ink">{firm}</div>
                <div className="text-[10.5px] text-ink-muted">July close</div>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-line px-3 py-2">
              <div className="text-[12px] font-medium text-ink">Bank statement</div>
              <button type="button" tabIndex={-1} className="mt-2 w-full rounded-md py-1.5 text-[11px] font-semibold" style={{ background: accent, color: on }}>
                Upload and send back
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: accent }}>
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full" style={{ background: accent, color: on }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17.5 19 6.5" /></svg>
              </span>
              Receipt ruled off
            </div>
          </div>
        </div>
      </div>

      {/* Reminder email mock */}
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Your reminder email</div>
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="px-4 py-3 text-[13px] font-semibold" style={{ background: accent, color: on }}>
            {firm}
          </div>
          <div className="p-4">
            <div className="text-[12px] leading-relaxed text-ink">A couple of items are still needed to close July.</div>
            <button type="button" tabIndex={-1} className="mt-3 rounded-md px-3 py-1.5 text-[11px] font-semibold" style={{ background: accent, color: on }}>
              Open my checklist
            </button>
            <div className="mt-3 text-[10.5px] text-ink-muted">Sent by {firm} via RuledOff</div>
          </div>
        </div>
      </div>
    </div>
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
  const [firmName, setFirmName] = useState(name);
  const [accent, setAccent] = useState(accentColor);
  const isPreset = ACCENT_PRESETS.some((p) => p.hex.toLowerCase() === accent.toLowerCase());

  return (
    <form action={action} className="sheet flex flex-col gap-5 p-5">
      {state.error && (
        <p className="text-sm" style={{ color: "var(--pending)" }}>
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Firm name (clients see this)</span>
        <input
          name="name"
          value={firmName}
          onChange={(e) => setFirmName(e.target.value)}
          required
          className="field"
        />
      </label>

      {/* Accent colour: presets + custom, with a live preview */}
      <div className="flex flex-col gap-2.5">
        <div>
          <span className="text-sm text-ink-muted">Accent colour</span>
          <p className="text-[12.5px] text-faint">
            The one colour your clients see on their link and in every reminder email.
          </p>
        </div>
        <input type="hidden" name="accent_color" value={accent} />
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((p) => {
            const selected = p.hex.toLowerCase() === accent.toLowerCase();
            return (
              <button
                key={p.hex}
                type="button"
                onClick={() => setAccent(p.hex)}
                title={p.name}
                aria-label={p.name}
                aria-pressed={selected}
                className="relative h-9 w-9 rounded-full transition-transform hover:scale-110"
                style={{
                  background: p.hex,
                  boxShadow: selected ? `0 0 0 2px var(--surface), 0 0 0 4px ${p.hex}` : "inset 0 0 0 1px rgba(0,0,0,0.08)",
                }}
              >
                {selected ? (
                  <span className="absolute inset-0 flex items-center justify-center" style={{ color: readableOn(p.hex) }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17.5 19 6.5" /></svg>
                  </span>
                ) : null}
              </button>
            );
          })}
          {/* Custom */}
          <label
            className="relative flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] font-medium text-ink-muted transition-colors hover:border-brand"
            style={!isPreset ? { borderColor: accent, color: accent } : undefined}
            title="Custom colour"
          >
            <span className="h-4 w-4 rounded-full" style={{ background: accent, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)" }} />
            Custom
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Custom accent colour"
            />
          </label>
        </div>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Reply-to email (optional)</span>
        <input
          name="reply_to"
          type="email"
          defaultValue={replyTo}
          className="field"
          placeholder="you@yourfirm.com"
        />
      </label>

      {/* Live preview */}
      <div className="rounded-2xl border border-line bg-surface-2/40 p-4">
        <BrandPreview name={firmName} accent={accent} />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Saving…">Save branding</SubmitButton>
        <Saved ok={state.ok} />
      </div>
    </form>
  );
}

const TEMPLATE_META: Record<EmailKind, { step: number; hint: string; tone: string }> = {
  initial: { step: 1, hint: "The first ask", tone: "var(--brand)" },
  level1: { step: 2, hint: "Friendly nudge", tone: "var(--success)" },
  level2: { step: 3, hint: "Specific, with a deadline", tone: "var(--pending)" },
  level3: { step: 4, hint: "Consequence framed", tone: "var(--danger)" },
  level4: { step: 5, hint: "Gentle weekly", tone: "var(--ink-muted)" },
};

const TEMPLATE_TOKENS = ["{{firstName}}", "{{firmName}}", "{{month}}", "{{openCount}}", "{{deadline}}"];

export function TemplateEditor({
  kind,
  subject,
  body,
  firmName,
  accent,
  pro,
}: {
  kind: EmailKind;
  subject: string;
  body: string;
  firmName: string;
  accent: string;
  pro: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(updateTemplateAction, emptyFormState);
  const [subjectVal, setSubjectVal] = useState(subject);
  const [bodyVal, setBodyVal] = useState(body);
  const meta = TEMPLATE_META[kind];

  const preview = <EmailPreview subject={subjectVal} body={bodyVal} firmName={firmName} accent={accent} />;

  return (
    <div className="sheet overflow-hidden border-l-[3px]" style={{ borderLeftColor: meta.tone }}>
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2/50"
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold"
          style={{ background: "var(--surface-2)", color: meta.tone }}
        >
          {meta.step}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text">{EMAIL_KIND_LABELS[kind]}</span>
          <span className="block truncate text-xs text-faint">{meta.hint}</span>
        </span>
        <ChevronDown
          size={16}
          className={"shrink-0 text-ink-muted transition-transform " + (open ? "rotate-180" : "")}
        />
      </button>
      {open && (
        <div className="grid gap-5 border-t border-line px-4 py-4 lg:grid-cols-2">
          <form action={action} className="flex flex-col gap-3">
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="subject" value={subjectVal} />
            <input type="hidden" name="body" value={bodyVal} />
            {state.error && (
              <p className="text-sm" style={{ color: "var(--pending)" }}>
                {state.error}
              </p>
            )}
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink-muted">Subject</span>
              <input
                value={subjectVal}
                onChange={(e) => setSubjectVal(e.target.value)}
                required
                className="field"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink-muted">Body</span>
              <textarea
                value={bodyVal}
                onChange={(e) => setBodyVal(e.target.value)}
                required
                rows={8}
                className="field"
              />
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-faint">Tokens:</span>
              {TEMPLATE_TOKENS.map((t) => (
                <span key={t} className="num rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-muted">
                  {t}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <SubmitButton variant="plain" pendingText="Saving…">
                Save
              </SubmitButton>
              <Saved ok={state.ok} />
            </div>
          </form>

          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <Eye size={13} /> Live preview
            </div>
            {pro ? preview : <ProLockOverlay feature="emailPreview">{preview}</ProLockOverlay>}
          </div>
        </div>
      )}
    </div>
  );
}
