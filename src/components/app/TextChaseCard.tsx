"use client";

import { useEffect, useState, useTransition } from "react";
import { logManualTextAction } from "@/app/(app)/qbo-actions";

/**
 * Hands the bookkeeper a ready-made reminder to send from their own phone.
 *
 * On a touch device this opens the SMS app with the message prefilled. On a
 * desktop there is nothing to open, so it copies instead. Either way the send
 * is logged as a manual_text reminder, so the auto-stop and the chase history
 * stay accurate.
 */
export function TextChaseCard({
  clientId,
  clientName,
  phone,
  message,
  smsUrl,
}: {
  clientId: string;
  clientName: string;
  phone: string | null;
  message: string;
  smsUrl: string;
}) {
  const [canText, setCanText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startLog] = useTransition();

  // Only offer the SMS hand-off where an SMS app actually exists.
  useEffect(() => {
    setCanText(
      typeof window !== "undefined" &&
        window.matchMedia("(hover: none) and (pointer: coarse)").matches,
    );
  }, []);

  const log = () => startLog(() => void logManualTextAction(clientId));

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      log();
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="sheet p-6">
      <h3 className="text-lg">Text it from your phone</h3>
      <p className="mt-1 text-sm text-ink-muted">
        Sent from your own number, so it lands like a message from you and not
        from a system.
      </p>

      <p className="mt-4 whitespace-pre-wrap break-words rounded-[8px] border border-rule bg-paper-deep p-3 text-sm">
        {message}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {canText && phone ? (
          <a href={smsUrl} onClick={log} className="btn btn-primary text-sm">
            Text {clientName.split(" ")[0]}
          </a>
        ) : null}
        <button type="button" onClick={copy} className="btn text-sm">
          {copied ? "Copied" : "Copy message"}
        </button>
        {!phone ? (
          <span className="text-xs text-ink-muted">
            Add a phone number for this client to text in one tap.
          </span>
        ) : null}
      </div>
    </div>
  );
}
