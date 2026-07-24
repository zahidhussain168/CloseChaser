import { CalendarClock, TrendingUp, AlertTriangle, CircleSlash } from "lucide-react";
import type { ClientForecast, ForecastRisk } from "@/lib/forecast";

const RISK: Record<
  ForecastRisk,
  { label: string; color: string; tint: string; spine: string; lead: string; Icon: typeof TrendingUp }
> = {
  on_track: {
    label: "On track",
    color: "var(--success)",
    tint: "var(--success-tint)",
    spine: "var(--success)",
    lead: "On track to rule off",
    Icon: TrendingUp,
  },
  at_risk: {
    label: "At risk",
    color: "#b45309",
    tint: "var(--warning-tint)",
    spine: "var(--pending)",
    lead: "At risk, likely",
    Icon: AlertTriangle,
  },
  stalled: {
    label: "Stalled",
    color: "var(--danger)",
    tint: "var(--danger-tint)",
    spine: "var(--danger)",
    lead: "Stalled, needs a nudge to finish",
    Icon: CircleSlash,
  },
};

function shortDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
}

function ConfidenceDot({ level }: { level: ClientForecast["confidence"] }) {
  const filled = level === "high" ? 3 : level === "medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-0.5" title={`${level} confidence, from this client's own history`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: i < filled ? "var(--ink-muted)" : "var(--line-strong)" }}
        />
      ))}
    </span>
  );
}

/**
 * The single-client view of the Close Forecast, for the client detail page.
 * Same scoring as the dashboard, shown as a compact forward-looking strip that
 * sits under the current-status cockpit.
 */
export function ClientForecastCard({ forecast }: { forecast: ClientForecast | null }) {
  if (!forecast) return null;
  const r = RISK[forecast.risk];
  const eta = forecast.etaDays <= 1 ? "by tomorrow" : `~ ${shortDate(forecast.etaDate)}`;

  return (
    <section className="sheet overflow-hidden border-l-[3px]" style={{ borderLeftColor: r.spine }}>
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{ background: `linear-gradient(180deg, ${r.tint}, transparent 200%)` }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: r.color }}>
            <CalendarClock size={18} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">Close Forecast</span>
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: r.tint, color: r.color }}>
                <r.Icon size={11} /> {r.label}
              </span>
            </div>
            <p className="mt-0.5 text-[15px] font-semibold text-text">{forecast.driver}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: r.color }}>{r.lead}</div>
          <div className="num text-[22px] font-bold leading-none" style={{ color: r.color }}>{eta === "by tomorrow" ? "tomorrow" : eta}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 text-[12px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="num font-semibold text-text">{forecast.medianResponseDays}d</span> typical response
          {forecast.responseStdDev != null ? <span className="num text-faint">±{forecast.responseStdDev}d</span> : null}
        </span>
        {forecast.trend ? (
          <span
            className="inline-flex items-center gap-1"
            style={{ color: forecast.trend === "improving" ? "var(--success)" : forecast.trend === "slipping" ? "var(--danger)" : "var(--ink-muted)" }}
          >
            {forecast.trend === "improving" ? "Getting faster" : forecast.trend === "slipping" ? "Getting slower" : "Steady"}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <span className="num font-semibold text-text">{forecast.openCount}</span> open now
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ConfidenceDot level={forecast.confidence} />
          <span className="capitalize">{forecast.confidence} confidence</span>
          {forecast.sampleSize > 0 ? <span className="text-faint">({forecast.sampleSize} past)</span> : <span className="text-faint">(new client)</span>}
        </span>
      </div>
    </section>
  );
}
