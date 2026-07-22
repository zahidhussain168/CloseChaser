import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import Link from "next/link";
import { getClientDetail, listTemplates, getFirm } from "@/lib/data";
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
import { ItemActions } from "@/components/app/ItemActions";
import { ImportPanel } from "@/components/app/ImportPanel";
import { TextChaseCard } from "@/components/app/TextChaseCard";
import { CloseCockpit } from "@/components/app/CloseCockpit";
import { buildTextMessage, smsHref } from "@/lib/textmessage";
import { getQboConnection } from "@/lib/qbo/connection";
import type { Attachment, Item } from "@/lib/types";

const STATE_LABEL: Record<string, string> = {
  requested: "waiting",
  nudged: "nudged",
  answered: "answered",
  accepted: "ruled off",
};

function pillClass(state: string): string {
  if (state === "accepted") return "pill pill-success";
  if (state === "answered") return "pill pill-brand";
  return "pill pill-warning";
}

// The checklist reads as a workflow, not a flat list.
const GROUPS = [
  { key: "waiting", label: "Waiting on your client", dot: "var(--warning)", match: (s: string) => s === "requested" || s === "nudged" },
  { key: "review", label: "Back from your client", dot: "var(--brand)", match: (s: string) => s === "answered" },
  { key: "ruled", label: "Ruled off", dot: "var(--success)", match: (s: string) => s === "accepted" },
] as const;

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

function ItemRow({ item, clientId, idx }: { item: Item; clientId: string; idx: number }) {
  const attachments = (item.attachments ?? []) as Attachment[];
  const accepted = item.state === "accepted";
  return (
    <div className="relative">
      <div
        className="reveal-row grid grid-cols-[2rem_1fr_auto] items-start gap-3 py-4"
        style={{ ["--i"]: idx } as CSSProperties}
      >
        <span className="flex justify-center pt-0.5">
          <StatusMark state={item.state} />
        </span>
        <span className="min-w-0">
          <span className="block font-medium" style={accepted ? { color: "var(--cleared)" } : undefined}>
            {item.title}
          </span>
          {item.type === "transaction" && <TxnMeta details={item.details as Record<string, unknown>} />}
          {typeof (item.details as { note?: string })?.note === "string" && (
            <span className="mt-0.5 block text-xs text-ink-muted">
              {(item.details as { note?: string }).note}
            </span>
          )}
          {item.type === "questionnaire" &&
            !item.answer_text &&
            Array.isArray((item.details as { questions?: string[] }).questions) && (
              <span className="mt-1.5 block">
                <ol className="list-decimal space-y-0.5 pl-5 text-xs text-ink-muted">
                  {((item.details as { questions?: string[] }).questions ?? []).map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ol>
              </span>
            )}
          {item.answer_text && (
            <span className="mt-2 block whitespace-pre-wrap rounded-[10px] px-3 py-2 text-sm" style={{ background: "var(--paper-deep)" }}>
              {item.type === "questionnaire" ? item.answer_text : `“${item.answer_text}”`}
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
                  style={{ borderColor: "var(--rule-strong)", color: "var(--cleared)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                  {a.name}
                </a>
              ))}
            </span>
          )}
          <ItemActions
            itemId={item.id}
            clientId={clientId}
            state={item.state}
            qboSyncedAt={item.source === "qbo" ? item.qbo_synced_at : null}
            qboSyncError={item.source === "qbo" ? item.qbo_sync_error : null}
          />
        </span>
        <span className={pillClass(item.state) + " num shrink-0"}>{STATE_LABEL[item.state]}</span>
      </div>
      {accepted && <DoubleRule drawn className="ml-8 mr-1 -mt-1 mb-1.5" />}
    </div>
  );
}

export default async function ClientPage({ params }: { params: { id: string } }) {
  const detail = await getClientDetail(params.id);
  if (!detail) notFound();

  const { client, period, items } = detail;
  const supabase = createClient();
  const qboConnected = Boolean(await getQboConnection());
  const link = await getActiveLink(supabase, client.id);
  const url = link ? magicLinkUrl(serverEnv.appUrl, link.token) : null;
  const opened = !!link?.lastOpenedAt;
  const openedLabel = link ? (opened ? `Opened ${timeAgo(link.lastOpenedAt)}` : "Not opened yet") : null;
  const open = openCount(items);
  const firm = await getFirm();
  const textMessage = buildTextMessage({
    firmName: firm?.name ?? "Your bookkeeper",
    clientName: client.name,
    monthLabel: formatMonth(period.month),
    openItems: items.filter((i) => isOpen(i.state)),
    url: url ?? "",
  });
  const templates = (await listTemplates()).map((t) => ({ id: t.id, name: t.name }));
  const done = items.length - open;
  const fill = items.length ? done / items.length : 0;
  const pct = Math.round(fill * 100);
  const closed = period.status === "closed";
  const allDone = items.length > 0 && open === 0;

  const initials = client.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const headStatus = allDone
    ? { cls: "pill pill-success", text: closed ? "ruled off" : "ready to close" }
    : open
      ? { cls: "pill pill-warning", text: `${open} open` }
      : { cls: "pill pill-brand", text: "no items yet" };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/dashboard"
        className="tap inline-flex items-center gap-1 self-start text-sm text-ink-muted hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        Clients
      </Link>

      <CloseCockpit
        clientId={client.id}
        name={client.name}
        initials={initials}
        monthLabel={formatMonth(period.month)}
        statusCls={headStatus.cls}
        statusText={headStatus.text}
        done={done}
        total={items.length}
        fill={fill}
        pct={pct}
        openCount={open}
        chasing={period.status === "chasing"}
        url={url}
        openedLabel={openedLabel}
        opened={opened}
        email={client.email}
        phone={client.phone}
        books={client.qbo_realm_id ? "QuickBooks" : "Manual"}
        textPanel={
          <TextChaseCard
            clientId={client.id}
            clientName={client.name}
            phone={client.phone}
            message={textMessage}
            smsUrl={smsHref(client.phone, textMessage)}
          />
        }
        addPanel={
          <div className="sheet flex flex-col gap-5 p-5">
            <div>
              <h2 className="text-sm font-semibold text-text">New request</h2>
              <div className="mt-3">
                <AddItemForm clientId={client.id} />
              </div>
            </div>
            <div className="border-t border-line pt-5">
              <ImportPanel clientId={client.id} qboConnected={qboConnected} />
            </div>
            <div className="border-t border-line pt-5">
              <ClientTemplatePicker
                clientId={client.id}
                templates={templates}
                defaultTemplateId={client.default_template_id}
              />
            </div>
          </div>
        }
      />

      {/* Completion moment */}
      {allDone ? (
        <div
          className="sheet px-6 py-7 text-center"
          style={{ borderColor: "var(--success)", background: "var(--success-tint)" }}
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--success)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17.5 19 6.5" /></svg>
          </div>
          <p className="mt-3 font-display text-xl font-bold" style={{ color: "var(--cleared)" }}>Ruled off.</p>
          <p className="mt-1 text-sm text-ink-muted">
            {formatMonth(period.month)} is clear. All {items.length} item{items.length === 1 ? "" : "s"} are in.
          </p>
          <div className="mx-auto mt-4 w-40"><DoubleRule drawn /></div>
        </div>
      ) : null}

      {/* Checklist, the hero */}
      {items.length === 0 ? (
        <div className="sheet px-5 py-14 text-center">
          <div className="empty-nib mb-5" aria-hidden="true">
            <span className="line" />
            <span className="nib" />
          </div>
          <p className="t-h3 font-display font-semibold">Nothing on the checklist yet.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Use <span className="font-medium text-text">Add</span> above to start this close: a request, a QuickBooks pull, or a template.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {GROUPS.map((g) => {
            const groupItems = items.filter((it) => g.match(it.state));
            if (groupItems.length === 0) return null;
            return (
              <section key={g.key} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: g.dot }} />
                  <h2 className="text-sm font-semibold text-text">{g.label}</h2>
                  <span className="num text-xs text-faint">{groupItems.length}</span>
                </div>
                <div className="sheet overflow-hidden px-4 sm:px-5">
                  {groupItems.map((item, i) => (
                    <ItemRow key={item.id} item={item} clientId={client.id} idx={i} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
