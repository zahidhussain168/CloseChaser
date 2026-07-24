"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock, Check, Send, TrendingUp, AlertTriangle, CircleSlash } from "lucide-react";
import { fireChaseAction } from "@/app/(app)/actions";
import type { CloseForecast as Forecast, ClientForecast, ForecastRisk } from "@/lib/forecast";

const RISK: Record<ForecastRisk, { label: string; color: string; tint: string; Icon: typeof TrendingUp }> = {
  on_track: { label: "On track", color: "var(--success)", tint: "var(--success-tint)", Icon: TrendingUp },
  at_risk: { label: "At risk", color: "#b45309", tint: "var(--warning-tint)", Icon: AlertTriangle },
  stalled: { label: "Stalled", color: "var(--danger)", tint: "var(--danger-tint)", Icon: CircleSlash },
};

function shortDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
}

function etaLabel(f: ClientForecast) {
  return f.etaDays <= 1 ? "by tomorrow" : `~ ${shortDate(f.etaDate)}`;
}

function ChaseInline({ clientId, primary }: { clientId: string; primary?: boolean }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-semibold text-success">
        <Check size={14} /> Sent
      </span>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { const r = await fireChaseAction(clientId); if (r?.ok) setDone(true); })}
      className={
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition-colors disabled:opacity-60 " +
        (primary
          ? "bg-brand px-3 py-1.5 text-[12.5px] text-white shadow-brand hover:bg-brand-600"
          : "border border-line px-3 py-1.5 text-[12.5px] text-ink-muted hover:bg-surface-2 hover:text-text")
      }
    >
      <Send size={13} /> {pending ? "Sending" : "Chase"}
    </button>
  );
}

function ConfidenceDot({ level }: { level: ClientForecast["confidence"] }) {
  const filled = level === "high" ? 3 : level === "medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-0.5" title={`${level} confidence, from this client's own history`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i < filled ? "var(--ink-muted)" : "var(--line-strong)" }} />
      ))}
    </span>
  );
}

export function CloseForecast({ forecast }: { forecast: Forecast }) {
  const { clients, onTrack, atRisk, stalled, horizonDate, daysToClose } = forecast;

  const headline = useMemo(() => {
    const risky = atRisk + stalled;
    if (risky === 0) return { tone: "ok" as const, text: "Every active close is on pace." };
    return { tone: "warn" as const, text: `${risky} client${risky === 1 ? "" : "s"} could make you late.` };
  }, [atRisk, stalled]);

  if (clients.length === 0) return null;

  const tone = headline.tone;
  const accent = tone === "ok" ? "var(--success)" : "var(--pending)";
  // The single most-urgent client leads the list (already sorted worst-first).
  const firstRiskyId = clients.find((c) => c.risk !== "on_track")?.clientId ?? null;

  const seg = [
    { key: "on", n: onTrack, color: "var(--success)", label: "on track" },
    { key: "risk", n: atRisk, color: "var(--pending)", label: "at risk" },
    { key: "stall", n: stalled, color: "var(--danger)", label: "stalled" },
  ].filter((s) => s.n > 0);

  return (
    <section className="sheet overflow-hidden">
      {/* Header band: title, the projected finish date as the focal point, and a
          close-health bar. Only the band carries a whisper of tone tint so the
          card still reads as part of the calm dashboard. */}
      <div
        className="border-b border-line px-5 py-5 sm:px-6"
        style={{ background: `linear-gradient(180deg, ${tone === "ok" ? "var(--success-tint)" : "var(--warning-tint)"}, transparent 160%)` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: accent }}>
              <CalendarClock size={19} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="t-h3 font-display font-semibold">Close Forecast</h2>
                <span className="pill text-[10px]" style={{ background: "var(--surface-2)", color: "var(--faint)" }}>Predicted</span>
              </div>
              <p className="mt-0.5 text-[14px] text-ink-muted">{headline.text}</p>
            </div>
          </div>

          {horizonDate ? (
            <div className="text-right">
              <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: accent }}>
                {tone === "ok" ? "Whole book by" : "Book cleared by"}
              </div>
              <div className="num text-[26px] font-bold leading-none" style={{ color: accent }}>{shortDate(horizonDate)}</div>
            </div>
          ) : null}
        </div>

        {/* Close-health bar */}
        <div className="mt-4">
          <div className="flex gap-1">
            {seg.map((s) => (
              <span key={s.key} className="h-2 rounded-full" style={{ background: s.color, flexGrow: s.n, minWidth: 22 }} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-muted">
            {seg.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                <span className="num font-semibold text-text">{s.n}</span> {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Per-client rows */}
      <div className="divide-y divide-line">
        {clients.map((f) => {
          const r = RISK[f.risk];
          const isFirst = f.clientId === firstRiskyId;
          return (
            <div key={f.clientId} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2/50 sm:px-6">
              <Link href={`/clients/${f.clientId}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold text-text">{f.name}</span>
                  <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: r.tint, color: r.color }}>
                    <r.Icon size={11} /> {r.label}
                  </span>
                  {isFirst ? (
                    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                      Nudge first
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 truncate text-[12.5px] text-ink-muted">{f.driver}</div>
              </Link>

              <div className="shrink-0 text-right">
                <div className="num text-[13px] font-semibold" style={{ color: r.color }}>{etaLabel(f)}</div>
                <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] text-faint">
                  <ConfidenceDot level={f.confidence} />
                  <span className="num">{f.openCount}</span> open
                </div>
              </div>

              <div className="w-[76px] shrink-0 text-right">
                {f.risk !== "on_track" && f.email ? <ChaseInline clientId={f.clientId} primary={isFirst} /> : null}
              </div>
            </div>
          );
        })}
      </div>

      {daysToClose.current != null && daysToClose.delta != null && daysToClose.baseline != null ? (
        <div className="flex items-center gap-2 border-t border-line px-5 py-2.5 text-[12px] sm:px-6">
          <span className="text-ink-muted">Closes are taking</span>
          <span className="num font-semibold text-text">{daysToClose.current}d</span>
          <span
            className="num font-semibold"
            style={{ color: daysToClose.delta < 0 ? "var(--success)" : daysToClose.delta > 0 ? "var(--danger)" : "var(--ink-muted)" }}
          >
            {daysToClose.delta === 0
              ? "same as"
              : `${daysToClose.delta < 0 ? "" : "+"}${daysToClose.delta}d vs`}{" "}
            your {daysToClose.baseline}d average
          </span>
        </div>
      ) : null}

      <p className="border-t border-line bg-surface-2/40 px-5 py-2.5 text-[11px] text-faint sm:px-6">
        Estimated from each client&apos;s own response history. Accuracy grows every month you close with them.
      </p>
    </section>
  );
}
