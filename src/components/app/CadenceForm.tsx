"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Send, Repeat } from "lucide-react";
import { updateCadenceAction } from "@/app/(app)/actions";
import { emptyFormState } from "@/lib/forms";

/**
 * When reminders go out. The wording of each level is edited separately, below
 * this on the settings page, because the escalation is carried by the copy.
 *
 * The abstract "2, 5, 9" is turned into a live escalation timeline so the
 * bookkeeper can see the rhythm and firmness of their chase at a glance, plus a
 * few one-tap presets.
 */

const PRESETS: { name: string; offsets: number[]; weekly: number }[] = [
  { name: "Gentle", offsets: [3, 7, 14], weekly: 10 },
  { name: "Standard", offsets: [2, 5, 9], weekly: 7 },
  { name: "Persistent", offsets: [1, 3, 6, 10], weekly: 5 },
];

const STEP_SUB = ["Friendly", "Specific", "Consequence", "Firm nudge"];

function reminderColor(i: number, count: number): string {
  if (count <= 1 || i === 0) return "var(--brand)";
  if (i === count - 1) return "var(--danger)";
  return "var(--pending)";
}

export function CadenceForm({ offsets, weeklyStep }: { offsets: number[]; weeklyStep: number }) {
  const [state, action] = useFormState(updateCadenceAction, emptyFormState);
  const [offsetsStr, setOffsetsStr] = useState(offsets.join(", "));
  const [weekly, setWeekly] = useState(String(weeklyStep));

  const sorted = [
    ...new Set(
      offsetsStr
        .split(/[,\s]+/)
        .map((s) => parseInt(s, 10))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ].sort((a, b) => a - b);
  const weeklyNum = Math.max(1, parseInt(weekly, 10) || weeklyStep);

  type Node = { label: string; sub: string; color: string; kind: "start" | "day" | "weekly"; day?: number };
  const nodes: Node[] = [
    { label: "Start", sub: "chase sent", color: "var(--brand)", kind: "start" },
    ...sorted.map((d, i) => ({
      label: `Day ${d}`,
      sub: STEP_SUB[i] ?? "Nudge",
      color: reminderColor(i, sorted.length),
      kind: "day" as const,
      day: d,
    })),
    { label: `Every ${weeklyNum}d`, sub: "until done", color: "var(--ink-muted)", kind: "weekly" as const },
  ];

  const activePreset = PRESETS.find(
    (p) => p.offsets.join(",") === sorted.join(",") && p.weekly === weeklyNum,
  );

  return (
    <form action={action} className="sheet flex flex-col gap-5 p-6">
      {/* Live escalation timeline */}
      <div className="rounded-xl border border-line bg-surface-2/40 p-4">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-faint">Your chase rhythm</div>
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-start pb-1">
            {nodes.map((n, i) => (
              <div key={i} className="flex items-start">
                {i > 0 ? (
                  <div
                    className="mt-[18px] h-[3px] w-9 rounded-full sm:w-14"
                    style={{ background: `linear-gradient(90deg, ${nodes[i - 1].color}, ${n.color})` }}
                  />
                ) : null}
                <div className="flex w-[68px] flex-col items-center text-center sm:w-20">
                  <span
                    className="num flex h-9 w-9 items-center justify-center rounded-full bg-surface text-[12px] font-bold"
                    style={{ color: n.color, boxShadow: `inset 0 0 0 1.6px ${n.color}` }}
                  >
                    {n.kind === "start" ? <Send size={14} /> : n.kind === "weekly" ? <Repeat size={14} /> : n.day}
                  </span>
                  <span className="mt-1.5 text-[11.5px] font-semibold text-text">{n.label}</span>
                  <span className="text-[10px] text-faint">{n.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-ink-muted">Quick set:</span>
        {PRESETS.map((p) => {
          const on = activePreset?.name === p.name;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => {
                setOffsetsStr(p.offsets.join(", "));
                setWeekly(String(p.weekly));
              }}
              className={
                "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors " +
                (on ? "border-brand bg-brand-tint text-brand" : "border-line text-ink-muted hover:border-brand hover:text-text")
              }
            >
              {p.name}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="offsets" className="block text-sm font-medium">Remind on these days</label>
          <p className="mt-1 min-h-[2rem] text-xs leading-4 text-ink-muted">Counted from the day you start the chase. Separate with commas.</p>
          <input
            id="offsets"
            name="offsets"
            value={offsetsStr}
            onChange={(e) => setOffsetsStr(e.target.value)}
            className="field num mt-2"
            placeholder="2, 5, 9"
          />
        </div>

        <div>
          <label htmlFor="weeklyStep" className="block text-sm font-medium">Then every</label>
          <p className="mt-1 min-h-[2rem] text-xs leading-4 text-ink-muted">Once those are used up, keep nudging on this interval.</p>
          <div className="relative mt-2">
            <input
              id="weeklyStep"
              name="weeklyStep"
              type="number"
              min={3}
              max={30}
              value={weekly}
              onChange={(e) => setWeekly(e.target.value)}
              className="field num w-full pr-14"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted">days</span>
          </div>
        </div>
      </div>

      <p className="rounded-lg bg-surface-2/50 px-3.5 py-2.5 text-[13px] text-ink-muted">
        Reminders stop the moment every item is answered, so a responsive client never gets a nudge they do not need.
      </p>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary text-sm">Save cadence</button>
        {state.ok ? (
          <span className="text-sm" style={{ color: "var(--cleared)" }}>Saved.</span>
        ) : null}
        {state.error ? (
          <span className="text-sm" style={{ color: "var(--pending)" }}>{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
