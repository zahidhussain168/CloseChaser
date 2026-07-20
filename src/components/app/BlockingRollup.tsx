import type { CloseRollup } from "@/lib/data";

function names(list: string[]): string {
  if (list.length <= 2) return list.join(" and ");
  return `${list.slice(0, 2).join(", ")} and ${list.length - 2} more`;
}

/**
 * What is holding the close up, in sentences rather than numbers. The stat
 * cards above already give the counts; this says what to actually do next.
 */
export function BlockingRollup({ rollup }: { rollup: CloseRollup }) {
  const lines: { text: string; tone: "pending" | "ink" }[] = [];

  const { documentsOpen: docs, transactionsOpen: txns } = rollup;
  if (docs || txns) {
    const parts = [
      docs ? `${docs} document${docs === 1 ? "" : "s"}` : null,
      txns ? `${txns} transaction${txns === 1 ? "" : "s"}` : null,
    ].filter(Boolean);
    lines.push({ text: `Waiting on ${parts.join(" and ")}.`, tone: "ink" });
  }

  if (rollup.notChased.length) {
    lines.push({
      text: `Not chased yet: ${names(rollup.notChased)}.`,
      tone: "pending",
    });
  }

  if (rollup.neverOpened.length) {
    lines.push({
      text: `Has not opened the link: ${names(rollup.neverOpened)}. A text usually fixes this.`,
      tone: "pending",
    });
  }

  if (rollup.oldest && rollup.oldest.days >= 3) {
    lines.push({
      text: `Oldest is ${rollup.oldest.days} days: "${rollup.oldest.title}" for ${rollup.oldest.client}.`,
      tone: "pending",
    });
  }

  if (!lines.length) return null;

  return (
    <section className="sheet p-6">
      <h2 className="text-lg">What is blocking this week</h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {lines.map((l) => (
          <li key={l.text} className="flex items-start gap-3 text-sm">
            <span
              className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                background: l.tone === "pending" ? "var(--pending)" : "var(--rule-strong)",
              }}
            />
            <span>{l.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
