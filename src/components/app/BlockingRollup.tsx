import { Inbox, Send, EyeOff, Clock, AlertTriangle, type LucideIcon } from "lucide-react";
import type { CloseRollup } from "@/lib/data";

function names(list: string[]): string {
  if (list.length <= 2) return list.join(" and ");
  return `${list.slice(0, 2).join(", ")} and ${list.length - 2} more`;
}

type Line = { text: string; tone: "pending" | "ink"; Icon: LucideIcon };

/**
 * What is holding the close up, in sentences rather than numbers. The stat cards
 * above already give the counts; this says what to actually do next, each line
 * carrying its own icon and tone so the eye lands on what needs a nudge.
 */
export function BlockingRollup({ rollup }: { rollup: CloseRollup }) {
  const lines: Line[] = [];

  const { documentsOpen: docs, transactionsOpen: txns } = rollup;
  if (docs || txns) {
    const parts = [
      docs ? `${docs} document${docs === 1 ? "" : "s"}` : null,
      txns ? `${txns} transaction${txns === 1 ? "" : "s"}` : null,
    ].filter(Boolean);
    lines.push({ text: `Waiting on ${parts.join(" and ")}.`, tone: "ink", Icon: Inbox });
  }

  if (rollup.notChased.length) {
    lines.push({ text: `Not chased yet: ${names(rollup.notChased)}.`, tone: "pending", Icon: Send });
  }

  if (rollup.neverOpened.length) {
    lines.push({
      text: `Has not opened the link: ${names(rollup.neverOpened)}. A text usually fixes this.`,
      tone: "pending",
      Icon: EyeOff,
    });
  }

  if (rollup.oldest && rollup.oldest.days >= 3) {
    lines.push({
      text: `Oldest is ${rollup.oldest.days} days: "${rollup.oldest.title}" for ${rollup.oldest.client}.`,
      tone: "pending",
      Icon: Clock,
    });
  }

  if (!lines.length) return null;

  return (
    <section className="sheet overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--warning-tint)", color: "var(--pending)" }}
        >
          <AlertTriangle size={19} />
        </span>
        <div>
          <h2 className="t-h3 font-display font-semibold">What is blocking this week</h2>
          <p className="text-xs text-faint">
            {lines.length} thing{lines.length === 1 ? "" : "s"} to move before the close lands
          </p>
        </div>
      </div>
      <ul className="divide-y divide-line">
        {lines.map((l) => {
          const tinted = l.tone === "pending";
          return (
            <li key={l.text} className="flex items-start gap-3 px-5 py-3.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: tinted ? "var(--warning-tint)" : "var(--surface-2)",
                  color: tinted ? "#b45309" : "var(--ink-muted)",
                }}
              >
                <l.Icon size={15} />
              </span>
              <span className="pt-1.5 text-sm leading-snug text-text">{l.text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
