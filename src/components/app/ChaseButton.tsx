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
    <div className="flex flex-col items-start gap-2">
      <button
        disabled={pending}
        className="btn btn-primary"
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
        {pending
          ? "Sending…"
          : chasing
            ? "Re-send chase"
            : `Chase ${openCount} item${openCount === 1 ? "" : "s"}`}
      </button>
      {msg && (
        <p
          className="text-sm"
          style={{ color: msg.ok ? "var(--cleared)" : "var(--pending)" }}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
