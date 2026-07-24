"use client";

import { initials, readableOn } from "@/lib/format";

/**
 * A live, client-side rendering of the branded chase email, mirroring the design
 * of buildEmailHtml so the bookkeeper sees exactly what the client receives as
 * they edit the subject and body. Tokens are filled with sample values.
 */

const SAMPLE_ITEMS = [
  { title: "Bank statement", label: "Upload" },
  { title: "Receipt for $128.40", label: "Answer" },
  { title: "W-9 for Bright Design Co.", label: "Questions" },
];

function fill(s: string, firmName: string) {
  return s
    .replace(/\{\{firstName\}\}/g, "Maria")
    .replace(/\{\{firmName\}\}/g, firmName)
    .replace(/\{\{month\}\}/g, "July")
    .replace(/\{\{openCount\}\}/g, "3")
    .replace(/\{\{deadline\}\}/g, "Jul 30");
}

export function EmailPreview({
  subject,
  body,
  firmName,
  accent,
}: {
  subject: string;
  body: string;
  firmName: string;
  accent: string;
}) {
  const on = readableOn(accent);
  const onSoft = on === "#FFFFFF" ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.6)";
  const avatarBg = on === "#FFFFFF" ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.12)";
  const firm = firmName.trim() || "Your firm";
  const paras = fill(body, firm)
    .split(/\n\n+/)
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border border-line bg-surface-2/50 px-3 py-2 text-[12px]">
        <span className="text-faint">Subject</span>{" "}
        <span className="font-semibold text-text">{fill(subject, firm) || "(no subject)"}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {/* Branded header */}
        <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: accent }}>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-bold"
            style={{ background: avatarBg, color: on }}
          >
            {initials(firm)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold" style={{ color: on }}>{firm}</div>
            <div className="text-[10.5px]" style={{ color: onSoft }}>July close</div>
          </div>
        </div>

        <div className="p-4">
          <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-semibold text-[#334155]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} /> 3 items left to close July
          </span>

          {paras.map((p, i) => (
            <p key={i} className="mb-2 text-[12.5px] leading-relaxed text-[#334155]">
              {p.split("\n").map((line, j) => (
                <span key={j}>
                  {line}
                  {j < p.split("\n").length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          ))}

          <div className="my-3 flex flex-col gap-1.5">
            {SAMPLE_ITEMS.map((it) => (
              <div key={it.title} className="flex items-center gap-2 overflow-hidden rounded-lg border border-[#E8EDF3] bg-[#F8FAFC]">
                <span className="h-8 w-1 shrink-0" style={{ background: accent }} />
                <span className="flex-1 py-2 text-[12px] font-semibold text-[#0F172A]">{it.title}</span>
                <span className="mr-2.5 rounded-full bg-[#EEF2F6] px-2 py-0.5 text-[10px] font-semibold text-[#475569]">{it.label}</span>
              </div>
            ))}
          </div>

          <span
            className="inline-block rounded-lg px-4 py-2.5 text-[12.5px] font-bold"
            style={{ background: accent, color: on }}
          >
            Open your checklist &rarr;
          </span>
          <div className="mt-2.5 text-[10.5px] text-[#94A3B8]">Sent by {firm} · delivered with RuledOff</div>
        </div>
      </div>
    </div>
  );
}
