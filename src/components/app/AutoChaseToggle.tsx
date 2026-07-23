"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { setAutoChaseAction } from "@/app/(app)/client-actions";

/**
 * Recurring monthly requests switch. Only meaningful once a default pack is set,
 * so it is disabled until then. When on, the cron rebuilds this client's close
 * from the default template each month and starts the chase automatically.
 */
export function AutoChaseToggle({
  clientId,
  initial,
  hasTemplate,
}: {
  clientId: string;
  initial: boolean;
  hasTemplate: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();

  const toggle = () => {
    if (!hasTemplate || pending) return;
    const next = !on;
    setOn(next); // optimistic
    start(async () => {
      const r = await setAutoChaseAction(clientId, next);
      if (!r.ok) setOn(!next);
    });
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
          <RefreshCw size={15} />
        </span>
        <div>
          <div className="text-sm font-semibold text-text">Recurring every month</div>
          <div className="mt-0.5 text-xs text-ink-muted">
            {hasTemplate
              ? "Rebuild this pack and chase the client automatically at the start of each month."
              : "Pick a default pack above to switch this on."}
          </div>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Recurring monthly requests"
        disabled={!hasTemplate || pending}
        onClick={toggle}
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
        style={{ background: on ? "var(--brand)" : "var(--rule-strong)" }}
      >
        <span
          className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: on ? "translateX(22px)" : "translateX(2px)" }}
        />
      </button>
    </div>
  );
}
