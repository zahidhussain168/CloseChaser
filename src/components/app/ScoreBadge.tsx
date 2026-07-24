import { GRADE_COLOR, type Grade } from "@/lib/responsiveness";

/** Compact A-F responsiveness grade chip. "New" for clients without history. */
export function ScoreBadge({ grade, size = "sm" }: { grade: Grade; size?: "sm" | "md" }) {
  const g = GRADE_COLOR[grade];
  const dims = size === "md" ? "h-7 min-w-7 px-2 text-[13px]" : "h-5 min-w-5 px-1.5 text-[11px]";
  return (
    <span
      className={"num inline-flex items-center justify-center rounded-md font-bold " + dims}
      style={{ background: g.tint, color: g.color }}
      title={grade === "New" ? "Not enough history yet" : `Responsiveness grade ${grade}`}
    >
      {grade}
    </span>
  );
}
