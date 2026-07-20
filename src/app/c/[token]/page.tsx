import { loadPortal } from "@/lib/portal";
import { formatMonth, formatMoney, formatDate } from "@/lib/format";
import { PortalChecklist } from "@/components/portal/PortalChecklist";
import type { Attachment, Item } from "@/lib/types";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your checklist",
  robots: { index: false, follow: false },
};

function InvalidLink({ kind }: { kind: "not_found" | "expired" | "revoked" }) {
  const copy = {
    not_found: {
      h: "This link isn’t valid.",
      p: "Double-check the link in your email, or ask your bookkeeper to resend it.",
    },
    expired: {
      h: "This link has expired.",
      p: "Links are good for 30 days. Ask your bookkeeper for a fresh one.",
    },
    revoked: {
      h: "This link was replaced.",
      p: "A newer link was sent. Please use the most recent email.",
    },
  }[kind];
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
      <h1 className="t-h3 font-display font-semibold">{copy.h}</h1>
      <p className="mt-2 text-sm text-ink-muted">{copy.p}</p>
    </main>
  );
}

export default async function PortalPage({
  params,
}: {
  params: { token: string };
}) {
  const result = await loadPortal(params.token);
  if ("error" in result) return <InvalidLink kind={result.error.kind} />;

  const { firm, period, items } = result.data;
  const monthLabel = formatMonth(period.month);
  const initials = firm.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const mapped = items.map((i: Item) => {
    const d = (i.details ?? {}) as {
      note?: string;
      amount?: number;
      date?: string;
      payee?: string;
    };
    let meta: string | null = null;
    if (i.type === "transaction") {
      const parts: string[] = [];
      if (d.date) parts.push(formatDate(d.date));
      if (d.payee) parts.push(d.payee);
      if (typeof d.amount === "number") parts.push(formatMoney(d.amount));
      meta = parts.join(" · ") || null;
    }
    return {
      id: i.id,
      type: i.type,
      title: i.title,
      note: d.note ?? null,
      meta,
      state: i.state,
      answer_text: i.answer_text,
      attachments: ((i.attachments ?? []) as Attachment[]).map((a) => ({
        name: a.name,
      })),
    };
  });

  const brandStyle = {
    ["--brass"]: firm.accent_color || "#C59B3A",
  } as CSSProperties;

  return (
    <main
      className="page-enter mx-auto min-h-dvh max-w-md px-5 py-8"
      style={brandStyle}
    >
      <header className="mb-6 flex items-center gap-3">
        <span
          className="num flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          style={{ background: "var(--paper-sheet)", color: "var(--ink)", boxShadow: "var(--elev-1)" }}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <div
            className="truncate font-display text-xl font-semibold"
            style={{ color: "var(--ink)" }}
          >
            {firm.name}
          </div>
          <div className="num text-xs text-ink-muted">{monthLabel} close</div>
        </div>
      </header>

      <PortalChecklist
        token={params.token}
        monthLabel={monthLabel}
        items={mapped}
      />

      <footer className="mt-12 text-center text-xs text-ink-muted">
        Secured by RuledOff · no account needed
      </footer>
    </main>
  );
}
