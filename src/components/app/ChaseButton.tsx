"use client";

import { useState, useTransition } from "react";
import { fireChaseAction } from "@/app/(app)/actions";

export function ChaseButton({
  clientId,
  openCount,
  chasing,
}: {
  clientId: string;
  openCount: number;
  chasing: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (openCount === 0) return null;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        disabled={pending}
        className="btn btn-primary px-6 text-base"
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await fireChaseAction(clientId);
            if (res?.ok) {
              setMsg({ ok: true, text: "Sent. Reminders will run automatically." });
            } else {
              setMsg({ ok: false, text: res?.error ?? "Could not send." });
            }
          })
        }
      >
        {!pending && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 2 11 13" />
            <path d="m22 2-7 20-4-9-9-4Z" />
          </svg>
        )}
        {pending
          ? "Sending…"
          : chasing
            ? "Re-send chase"
            : `Chase ${openCount} item${openCount === 1 ? "" : "s"}`}
      </button>
      {msg ? (
        <p
          className="text-xs sm:text-right"
          style={{ color: msg.ok ? "var(--cleared)" : "var(--pending)" }}
        >
          {msg.text}
        </p>
      ) : (
        <p className="text-xs text-ink-muted sm:text-right">
          Reminders run automatically on day 2, 5, 9.
        </p>
      )}
    </div>
  );
}
