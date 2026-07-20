"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  applyTemplateAction,
  setClientDefaultTemplateAction,
} from "@/app/(app)/actions";

type TplOpt = { id: string; name: string };

export function ClientTemplatePicker({
  clientId,
  templates,
  defaultTemplateId,
}: {
  clientId: string;
  templates: TplOpt[];
  defaultTemplateId: string | null;
}) {
  const [pending, start] = useTransition();
  const [applySel, setApplySel] = useState(
    defaultTemplateId ?? templates[0]?.id ?? "",
  );
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (templates.length === 0) {
    return (
      <div className="sheet p-4 text-sm text-ink-muted">
        Create a template in{" "}
        <Link href="/settings" className="underline" style={{ color: "var(--ink)" }}>
          Settings
        </Link>{" "}
        to reuse standard requests every month.
      </div>
    );
  }

  return (
    <div className="sheet flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
      <label className="flex flex-col gap-1.5 text-sm sm:w-56">
        <span className="text-ink-muted">Auto-apply each month</span>
        <select
          className="field"
          defaultValue={defaultTemplateId ?? ""}
          disabled={pending}
          onChange={(e) =>
            start(() =>
              setClientDefaultTemplateAction(clientId, e.target.value || null),
            )
          }
        >
          <option value="">None</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1.5 text-sm sm:flex-1">
        <span className="text-ink-muted">Apply to this close now</span>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="field flex-1"
            value={applySel}
            onChange={(e) => setApplySel(e.target.value)}
            disabled={pending}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            disabled={pending || !applySel}
            className="btn shrink-0"
            onClick={() =>
              start(async () => {
                setMsg(null);
                const res = await applyTemplateAction(clientId, applySel);
                if (res.ok) {
                  const n = res.added ?? 0;
                  setMsg({
                    ok: true,
                    text: `Added ${n} item${n === 1 ? "" : "s"}.`,
                  });
                } else {
                  setMsg({ ok: false, text: res.error ?? "Could not apply." });
                }
              })
            }
          >
            {pending ? "Applying…" : "Apply now"}
          </button>
        </div>
        {msg && (
          <span
            className="text-xs"
            style={{ color: msg.ok ? "var(--cleared)" : "var(--pending)" }}
          >
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
