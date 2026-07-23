import { Check } from "lucide-react";

const BENEFITS = [
  "Your client just taps a link. No login, no portal, no app.",
  "QuickBooks sync, or work manual and CSV.",
  "Auto-reminders that stop the moment the items come in.",
];

/**
 * The branded right-hand panel of the auth split screen. Dark navy with a soft
 * brand glow, the product promise, a few real benefits, and a small "ruled off"
 * mock so the sign-in feels like a real product, not a bare form. Desktop only.
 */
export function AuthShowcase() {
  return (
    <div className="relative hidden overflow-hidden bg-[#0a1626] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
      {/* soft brand glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-16 h-96 w-96 rounded-full bg-brand/25 blur-[130px]" />
        <div className="absolute -bottom-16 right-0 h-96 w-96 rounded-full bg-brass/15 blur-[130px]" />
      </div>

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium text-slate-200">
          Built for solo bookkeepers
        </span>
        <h2 className="mt-7 font-display text-[34px] font-bold leading-[1.1] tracking-tight xl:text-[40px]">
          Close the month without chasing clients.
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-300">
          RuledOff collects every document, receipt, and answer blocking your
          close, then chases your client automatically until each item is ruled
          off.
        </p>
        <ul className="mt-8 flex flex-col gap-3.5">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[14.5px] text-slate-100">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                <Check size={13} strokeWidth={3} />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Mini "ruled off" mock */}
      <div className="relative">
        <div className="max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-white">July close</div>
              <div className="text-[12px] text-slate-400">Acme Coffee Roasters</div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
              <Check size={11} strokeWidth={3} /> 2 of 3 ruled off
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {[
              { label: "Bank statement", done: true },
              { label: "Receipt for $128.40", done: true },
              { label: "W-9 for Bright Design", done: false },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2">
                <span
                  className={
                    "flex h-4 w-4 items-center justify-center rounded-full " +
                    (r.done ? "bg-emerald-400 text-[#0a1626]" : "border border-white/25")
                  }
                >
                  {r.done ? <Check size={10} strokeWidth={3.5} /> : null}
                </span>
                <span className={"text-[13px] " + (r.done ? "text-slate-300 line-through" : "text-white")}>
                  {r.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-slate-400">
          <span>No card required</span>
          <span aria-hidden="true">•</span>
          <span>14-day free trial</span>
          <span aria-hidden="true">•</span>
          <span>Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}
