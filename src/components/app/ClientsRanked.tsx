import Link from "next/link";
import { Trophy } from "lucide-react";
import { ScoreBadge } from "@/components/app/ScoreBadge";
import type { ClientScore } from "@/lib/responsiveness";

/**
 * Clients ranked by responsiveness. Best-graded first, "New" clients last, so
 * the bookkeeper can see who to front-load at close kickoff at a glance.
 */
export function ClientsRanked({ scores }: { scores: ClientScore[] }) {
  const graded = scores.filter((s) => s.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const fresh = scores.filter((s) => s.score === null);
  const ordered = [...graded, ...fresh];
  if (ordered.length === 0) return null;

  return (
    <section className="sheet overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
          <Trophy size={19} />
        </span>
        <div>
          <h2 className="t-h3 font-display font-semibold">Your clients, ranked</h2>
          <p className="text-xs text-faint">By how they respond over time. Front-load the slow ones.</p>
        </div>
      </div>
      <ul className="divide-y divide-line">
        {ordered.map((s, i) => (
          <li key={s.clientId}>
            <Link href={`/clients/${s.clientId}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2/50">
              <span className="num w-5 shrink-0 text-center text-[13px] font-semibold text-faint">
                {s.score !== null ? i + 1 : ""}
              </span>
              <ScoreBadge grade={s.grade} />
              <span className="min-w-0 flex-1 truncate font-semibold text-text">{s.name}</span>
              <span className="shrink-0 text-right text-[12px] text-ink-muted">
                {s.avgResponseDays !== null ? (
                  <>
                    <span className="num font-semibold text-text">{s.avgResponseDays}d</span> avg reply
                  </>
                ) : (
                  <span className="text-faint">no history yet</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
