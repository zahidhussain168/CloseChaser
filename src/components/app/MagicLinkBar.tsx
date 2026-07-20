"use client";

import { useState, useTransition } from "react";
import { ensureLinkAction, regenerateLinkAction } from "@/app/(app)/actions";

export function MagicLinkBar({
  clientId,
  url,
  openedLabel,
  opened,
}: {
  clientId: string;
  url: string | null;
  openedLabel?: string | null;
  opened?: boolean;
}) {
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!url) {
    return (
      <div className="sheet flex items-center justify-between gap-3 p-4">
        <span className="text-sm text-ink-muted">No client link yet.</span>
        <button
          disabled={pending}
          className="btn"
          onClick={() => start(() => ensureLinkAction(clientId))}
        >
          {pending ? "Creating…" : "Create link"}
        </button>
      </div>
    );
  }

  return (
    <div className="sheet flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--paper-deep)", color: "var(--cleared)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 17H7A5 5 0 0 1 7 7h2" />
              <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
              <line x1="8" x2="16" y1="12" y2="12" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="text-sm font-medium">Client link</div>
            {openedLabel ? (
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    background: opened
                      ? "var(--cleared)"
                      : "var(--rule-strong)",
                  }}
                />
                <span className="text-ink-muted">{openedLabel}</span>
              </div>
            ) : (
              <div className="text-xs text-ink-muted">
                No login required. Opens on their phone.
              </div>
            )}
          </div>
        </div>
        <button
          className="btn shrink-0 px-4 py-2 text-sm"
          onClick={copy}
          style={
            copied
              ? { color: "var(--cleared)", borderColor: "var(--cleared)" }
              : undefined
          }
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Regenerate the link? The old one stops working.")) {
            start(() => regenerateLinkAction(clientId));
          }
        }}
        className="self-start text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline"
      >
        Regenerate link
      </button>
    </div>
  );
}
