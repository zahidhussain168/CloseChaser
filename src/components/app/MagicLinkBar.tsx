"use client";

import { useState, useTransition } from "react";
import { ensureLinkAction, regenerateLinkAction } from "@/app/(app)/actions";

export function MagicLinkBar({
  clientId,
  url,
}: {
  clientId: string;
  url: string | null;
}) {
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!url) {
    return (
      <button
        disabled={pending}
        className="btn"
        onClick={() => start(() => ensureLinkAction(clientId))}
      >
        {pending ? "Creating…" : "Create magic link"}
      </button>
    );
  }

  return (
    <div className="sheet flex flex-col gap-2 p-3">
      <div className="text-xs uppercase tracking-wide text-ink-muted">
        Client link — no login required
      </div>
      <div className="flex items-center gap-2">
        <code
          className="num flex-1 truncate rounded-[4px] px-2 py-1.5 text-xs"
          style={{ background: "var(--paper-deep)", color: "var(--ink)" }}
          title={url}
        >
          {url}
        </code>
        <button className="btn px-3 py-1.5 text-sm" onClick={copy}>
          {copied ? "Copied" : "Copy"}
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
