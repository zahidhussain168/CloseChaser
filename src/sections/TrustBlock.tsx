import Link from "next/link";
import { Lock, ShieldCheck, Timer, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

/**
 * Security, surfaced honestly on the homepage. A deliberately dark oxblood panel
 * (varies the section rhythm) with the security page's core argument: there is
 * less to protect because there is no client login to protect in the first
 * place. Left-aligned editorial layout.
 */

const POINTS = [
  {
    Icon: Lock,
    title: "No login, ever",
    body: "Your client taps a link and answers. There is no account to breach because there is no account.",
  },
  {
    Icon: ShieldCheck,
    title: "Private, encrypted storage",
    body: "Every upload lands in a private bucket, reached only through short-lived signed links.",
  },
  {
    Icon: Timer,
    title: "Links that expire",
    body: "Each magic link is scoped to one client and time-limited, and you can revoke it in a click.",
  },
];

export function TrustBlock() {
  return (
    <section
      className="section-y"
      style={{ background: "linear-gradient(160deg, #2a1017, #1c0b10)", color: "#f6ece9" }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <Reveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--brass)" }}>
              Security, honestly
            </p>
            <h2 className="t-h2 mt-4 font-display" style={{ color: "#fbf3ef" }}>
              The safest client portal is the one that does not exist.
            </h2>
            <p className="t-body-lg mt-5 max-w-lg" style={{ color: "rgba(246,236,233,0.72)" }}>
              Most tools bolt a login onto a pile of client data. We removed the login, so there is
              far less to protect in the first place. No passwords to leak, no portal to break into.
            </p>
            <Link
              href="/security"
              className="mt-7 inline-flex items-center gap-1.5 text-[15px] font-semibold"
              style={{ color: "var(--brass)" }}
            >
              See how we handle data
              <ArrowRight size={16} />
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex flex-col gap-3">
              {POINTS.map((p) => (
                <div
                  key={p.title}
                  className="flex items-start gap-3.5 rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "rgba(196,154,42,0.16)", color: "var(--brass)" }}
                  >
                    <p.Icon size={19} />
                  </span>
                  <div>
                    <h3 className="text-[15.5px] font-bold" style={{ color: "#fbf3ef" }}>{p.title}</h3>
                    <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: "rgba(246,236,233,0.66)" }}>
                      {p.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
