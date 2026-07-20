import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import Link from "next/link";
import { getClientDetail, listTemplates } from "@/lib/data";
import { getActiveLink } from "@/lib/links";
import { ClientTemplatePicker } from "@/components/app/ClientTemplatePicker";
import { createClient } from "@/lib/supabase/server";
import { magicLinkUrl } from "@/lib/tokens";
import { serverEnv } from "@/lib/env";
import { formatMonth, formatMoney, formatDate, timeAgo } from "@/lib/format";
import { openCount, isOpen } from "@/lib/state";
import { StatusMark } from "@/components/StatusMark";
import { DoubleRule } from "@/components/DoubleRule";
import { AddItemForm } from "@/components/app/AddItemForm";
import { ChaseButton } from "@/components/app/ChaseButton";
import { MagicLinkBar } from "@/components/app/MagicLinkBar";
import { ItemActions } from "@/components/app/ItemActions";
import type { Attachment, Item } from "@/lib/types";

const STATE_LABEL: Record<string, string> = {
  requested: "waiting",
  nudged: "nudged",
  answered: "answered",
  accepted: "ruled off",
};

function pillStyle(state: string): CSSProperties {
  if (state === "accepted")
    return { color: "var(--cleared)", background: "rgba(47,107,79,0.1)" };
  if (state === "answered")
    return { color: "var(--brass)", background: "rgba(168,139,76,0.12)" };
  return { color: "var(--pending)", background: "rgba(179,64,46,0.1)" };
}

function TxnMeta({ details }: { details: Record<string, unknown> }) {
  const amount = typeof details.amount === "number" ? details.amount : null;
  const date = typeof details.date === "string" ? details.date : null;
  const payee = typeof details.payee === "string" ? details.payee : null;
  if (amount == null && !date && !payee) return null;
  return (
    <span className="num mt-0.5 block text-xs text-ink-muted">
      {date ? formatDate(date) : ""}
      {payee ? ` · ${payee}` : ""}
      {amount != null ? ` · ${formatMoney(amount)}` : ""}
    </span>
  );
}

export default async function ClientPage({
  params,
}: {
  params: { id: string };
}) {
  const detail = await getClientDetail(params.id);
  if (!detail) notFound();

  const { client, period, items } = detail;
  const supabase = createClient();
  const link = await getActiveLink(supabase, client.id);
  const url = link ? magicLinkUrl(serverEnv.appUrl, link.token) : null;
  const opened = !!link?.lastOpenedAt;
  const openedLabel = link
    ? opened
      ? `Opened ${timeAgo(link.lastOpenedAt)}`
      : "Not opened yet"
    : null;
  const open = openCount(items);
  const templates = (await listTemplates()).map((t) => ({ id: t.id, name: t.name }));
  const done = items.length - open;
  const fill = items.length ? done / items.length : 0;
  const closed = period.status === "closed";
  const statusText = closed
    ? "ruled off"
    : open
      ? `${open} open`
      : items.length
        ? "clear"
        : "no items";
  const statusColor = closed || (!open && items.length)
    ? "var(--cleared)"
    : open
      ? "var(--pending)"
      : "var(--ink-muted)";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard"
          className="tap inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          Clients
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="t-h2 font-display font-semibold">{client.name}</h1>
            <p className="num mt-1.5 text-sm text-ink-muted">
              {client.email}
              {client.phone ? ` · ${client.phone}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="num text-xs text-ink-muted">
              {formatMonth(period.month)} close
            </span>
            <span
              className="num rounded-full px-3 py-1 text-xs"
              style={{
                color: statusColor,
                background:
                  statusColor === "var(--pending)"
                    ? "rgba(179,64,46,0.1)"
                    : statusColor === "var(--cleared)"
                      ? "rgba(47,107,79,0.1)"
                      : "var(--paper-deep)",
              }}
            >
              {statusText}
            </span>
            {items.length > 0 && (
              <span className="flex items-center gap-2">
                <span
                  className="ink-progress block w-28"
                  style={{ ["--fill"]: fill } as CSSProperties}
                  aria-hidden="true"
                >
                  <span />
                </span>
                <span className="num text-[11px] text-ink-muted">
                  {done}/{items.length}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <MagicLinkBar
          clientId={client.id}
          url={url}
          openedLabel={openedLabel}
          opened={opened}
        />
        <ChaseButton
          clientId={client.id}
          openCount={open}
          chasing={period.status === "chasing"}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="t-h3 font-display font-semibold">Close checklist</h2>
        {items.length === 0 ? (
          <div className="sheet px-5 py-12 text-center">
            <div className="empty-nib mb-5" aria-hidden="true">
              <span className="line" />
              <span className="nib" />
            </div>
            <p className="t-h3 font-display font-semibold">No open items.</p>
            <p className="mt-1 text-sm text-ink-muted">
              Nothing is blocking this close. Add a request below to start one.
            </p>
          </div>
        ) : (
          <div className="sheet overflow-hidden px-4 sm:px-5">
            {items.map((item: Item, idx) => {
              const attachments = (item.attachments ?? []) as Attachment[];
              const accepted = item.state === "accepted";
              return (
                <div key={item.id} className="relative">
                  <div
                    className="reveal-row grid grid-cols-[2rem_1fr_auto] items-start gap-3 py-4"
                    style={{ ["--i"]: idx } as CSSProperties}
                  >
                    <span className="flex justify-center pt-0.5">
                      <StatusMark state={item.state} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block font-medium"
                        style={accepted ? { color: "var(--cleared)" } : undefined}
                      >
                        {item.title}
                      </span>
                      {item.type === "transaction" && (
                        <TxnMeta details={item.details as Record<string, unknown>} />
                      )}
                      {typeof (item.details as { note?: string })?.note ===
                        "string" && (
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          {(item.details as { note?: string }).note}
                        </span>
                      )}
                      {item.answer_text && (
                        <span
                          className="mt-2 block rounded-[10px] px-3 py-2 text-sm"
                          style={{ background: "var(--paper-deep)" }}
                        >
                          &ldquo;{item.answer_text}&rdquo;
                        </span>
                      )}
                      {attachments.length > 0 && (
                        <span className="mt-2 flex flex-wrap gap-2">
                          {attachments.map((a, i) => (
                            <a
                              key={i}
                              href={`/api/attachments/${item.id}/${i}`}
                              target="_blank"
                              rel="noopener"
                              className="num inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors hover:text-ink"
                              style={{
                                borderColor: "var(--rule-strong)",
                                color: "var(--cleared)",
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                              {a.name}
                            </a>
                          ))}
                        </span>
                      )}
                      <ItemActions
                        itemId={item.id}
                        clientId={client.id}
                        state={item.state}
                      />
                    </span>
                    <span
                      className="num shrink-0 rounded-full px-2.5 py-1 text-xs"
                      style={pillStyle(item.state)}
                    >
                      {STATE_LABEL[item.state]}
                    </span>
                  </div>
                  {accepted && <DoubleRule drawn className="ml-8 mr-1 -mt-1 mb-1.5" />}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="t-h3 font-display font-semibold">Templates</h2>
        <ClientTemplatePicker
          clientId={client.id}
          templates={templates}
          defaultTemplateId={client.default_template_id}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="t-h3 font-display font-semibold">Add a request</h2>
        <AddItemForm clientId={client.id} />
      </section>
    </div>
  );
}
