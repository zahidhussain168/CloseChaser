import type { ReactNode } from "react";
import Link from "next/link";
import { Lock, Sparkles, ArrowRight, CalendarClock, Send, Repeat, Eye, Trophy, FileText, type LucideIcon } from "lucide-react";
import type { ProFeatureKey } from "@/lib/pro-features";
import { PRO_FEATURES } from "@/lib/pro-features";

/**
 * The paywall, done as an invitation rather than a wall. When a firm's trial
 * has ended, a premium feature is replaced by this: a gradient-edged card with
 * the feature's own icon, a soft brand watermark, a slow light shimmer, and a
 * single warm upgrade call to action. Flow layout (no absolutely-positioned
 * overlay) so nothing ever clips, at any width.
 */

const ICONS: Record<ProFeatureKey, LucideIcon> = {
  forecast: CalendarClock,
  aiAnalyst: Sparkles,
  responsiveness: Trophy,
  closeReceipt: FileText,
  bulkChase: Send,
  autoChase: Repeat,
  emailPreview: Eye,
};

export function ProLock({ feature, className }: { feature: ProFeatureKey; className?: string }) {
  const { title, blurb, tier } = PRO_FEATURES[feature];
  const Icon = ICONS[feature];
  const tierName = tier === "scale" ? "Scale" : "Pro";
  const priceLine = tier === "scale" ? "$69/mo, cancel anytime" : "$39/mo, cancel anytime";

  return (
    <div
      className={"relative overflow-hidden rounded-2xl p-[1.5px] " + (className ?? "")}
      style={{ background: "linear-gradient(135deg, var(--brand), var(--brass) 92%)" }}
    >
      <div className="pro-shimmer relative overflow-hidden rounded-[15px] bg-surface px-5 py-5 sm:px-6">
        {/* Soft brand watermark of the feature's own glyph */}
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -top-5 h-36 w-36 opacity-[0.05]"
          strokeWidth={1.25}
          style={{ color: "var(--brand)" }}
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-brand"
            style={{ background: "linear-gradient(135deg, var(--brand), var(--brass))" }}
          >
            <Icon size={22} />
          </span>

          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--brass-ink)" }}>
              <Sparkles size={12} /> {tierName} feature
            </span>
            <h3 className="mt-1 font-display text-lg font-semibold text-text">{title}</h3>
            <p className="mt-0.5 max-w-md text-[13.5px] leading-relaxed text-ink-muted">{blurb}</p>
          </div>

          <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
            <Link
              href="/settings/plan"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, var(--brand-solid), var(--brand-solid-2))" }}
            >
              <Lock size={14} /> Unlock {tierName} <ArrowRight size={15} />
            </Link>
            <span className="text-[11.5px] text-faint">Trial ended · {priceLine}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wraps a real (cheap-to-render) feature and, when locked, shows it blurred
 * behind a frosted overlay with an unlock CTA. Use where seeing the value
 * teased is the point (e.g. a live preview panel).
 */
export function ProLockOverlay({ feature, children }: { feature: ProFeatureKey; children: ReactNode }) {
  const { title, tier } = PRO_FEATURES[feature];
  const tierName = tier === "scale" ? "Scale" : "Pro";
  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="pointer-events-none select-none opacity-70 blur-[3px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/60 px-4 text-center backdrop-blur-[2px]">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-brand"
          style={{ background: "linear-gradient(135deg, var(--brand), var(--brass))" }}
        >
          <Lock size={18} />
        </span>
        <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--brass-ink)" }}>
          <Sparkles size={11} /> {tierName} feature
        </div>
        <div className="text-[13.5px] font-semibold text-text">{title}</div>
        <Link
          href="/settings/plan"
          className="mt-0.5 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-darker))" }}
        >
          Unlock {tierName} <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

/** Compact inline lock for a small control (e.g. a toggle in a settings row). */
export function ProLockInline({ feature }: { feature: ProFeatureKey }) {
  const { title } = PRO_FEATURES[feature];
  return (
    <Link
      href="/settings/plan"
      className="group inline-flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 px-3 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:border-brand hover:text-text"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--brand), var(--brass))" }}>
        <Lock size={12} />
      </span>
      {title} is a Pro feature
      <span className="font-semibold text-brand group-hover:underline">Upgrade</span>
    </Link>
  );
}
