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
import { FileText, Receipt, ListChecks, Bell, Eye, Clock } from "lucide-react";
import { AddItemForm } from "@/components/app/AddItemForm";
import { ItemActions } from "@/components/app/ItemActions";
import { ItemRemoveButton } from "@/components/app/ItemRemoveButton";
import { ClientEditForm } from "@/components/app/ClientEditForm";
import { BulkAcceptButton, CopyLastMonthButton } from "@/components/app/ClientQuickActions";
import { buildActivity, nextReminderInfo } from "@/lib/activity";
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

function toneColor(tone: string): string {
  if (tone === "success") return "var(--success)";
  if (tone === "brand") return "var(--brand)";
  if (tone === "warning") return "var(--warning)";
  return "var(--faint)";
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

const TYPE_META: Record<string, { Icon: typeof FileText; label: string }> = {
  document: { Icon: FileText, label: "Document" },
  transaction: { Icon: Receipt, label: "Transaction" },
  questionnaire: { Icon: ListChecks, label: "Questions" },
};

function ItemRow({ item, clientId, idx }: { item: Item; clientId: string; idx: number }) {
  const attachments = (item.attachments ?? []) as Attachment[];
  const accepted = item.state === "accepted";
  const answered = item.state === "answered";
  const type = TYPE_META[item.type] ?? TYPE_META.document;
  const TypeIcon = type.Icon;
  const age = item.created_at ? timeAgo(item.created_at) : null;
  return (
    <div className="group relative -mx-2 rounded-xl px-2 transition-colors hover:bg-[var(--paper-deep)]">
      <div
        className="reveal-row grid grid-cols-[2.25rem_1fr_auto] items-start gap-3 py-3.5"
        style={{ ["--i"]: idx } as CSSProperties}
      >
        <span className="flex justify-center pt-0.5">
          {accepted || answered ? (
            <StatusMark state={item.state} />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "var(--paper-sheet)", border: "1px solid var(--rule)", color: "var(--ink-muted)" }}
            >
              <TypeIcon size={15} />
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block font-medium" style={accepted ? { color: "var(--cleared)" } : undefined}>
            {item.title}
          </span>
          <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-wide text-faint">
            {type.label}
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
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={pillClass(item.state) + " num"}>{STATE_LABEL[item.state]}</span>
          {!accepted && age && <span className="num text-[11px] text-faint">{age}</span>}
          {!accepted && <ItemRemoveButton itemId={item.id} clientId={clientId} />}
        </span>
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

  const { data: reminderRows } = await supabase
    .from("reminders")
    .select("sent_at, channel")
    .eq("close_period_id", period.id);
  const sentCount = (reminderRows ?? []).filter((r) => r.sent_at).length;
  const activity = buildActivity({
    chaseStartedAt: period.chase_started_at ?? null,
    lastOpenedAt: link?.lastOpenedAt ?? null,
    items: items.map((i) => ({ title: i.title, answered_at: i.answered_at, accepted_at: i.accepted_at })),
    reminders: reminderRows ?? [],
  });
  const fcad = firm as { reminder_offsets?: number[]; reminder_weekly_step?: number } | null;
  const nextRem =
    period.status === "chasing"
      ? nextReminderInfo({
          chaseStartedAt: period.chase_started_at ?? null,
          sentCount,
          cadence: {
            offsets: fcad?.reminder_offsets ?? [2, 5, 9],
            weeklyStep: fcad?.reminder_weekly_step ?? 7,
          },
        })
      : null;
  const answeredCount = items.filter((i) => i.state === "answered").length;

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

      {/* Detail strip: next nudge, preview, edit, private note */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
            {nextRem && (
              <span className="inline-flex items-center gap-1.5">
                <Bell size={14} />
                Next nudge{" "}
                {nextRem.inDays === 0 ? "today" : `in ${nextRem.inDays} day${nextRem.inDays === 1 ? "" : "s"}`}{" "}
                <span className="text-faint">({nextRem.label})</span>
              </span>
            )}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
              >
                <Eye size={14} /> Preview client view
              </a>
            )}
          </div>
          <ClientEditForm
            client={{
              id: client.id,
              name: client.name,
              email: client.email,
              phone: client.phone,
              notes: client.notes,
            }}
          />
        </div>
        {client.notes ? (
          <div className="rounded-xl px-4 py-3" style={{ background: "var(--paper-deep)" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">
              Private note
            </span>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{client.notes}</p>
          </div>
        ) : null}
      </div>

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
          <div className="mt-5 flex justify-center">
            <CopyLastMonthButton clientId={client.id} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="-mb-3 flex justify-end">
            <CopyLastMonthButton clientId={client.id} />
          </div>
          {GROUPS.map((g) => {
            const groupItems = items.filter((it) => g.match(it.state));
            if (groupItems.length === 0) return null;
            return (
              <section key={g.key} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: g.dot }} />
                  <h2 className="text-sm font-semibold text-text">{g.label}</h2>
                  <span className="num text-xs text-faint">{groupItems.length}</span>
                  {g.key === "review" && groupItems.length >= 2 && (
                    <span className="ml-auto">
                      <BulkAcceptButton clientId={client.id} count={groupItems.length} />
                    </span>
                  )}
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

      {activity.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 px-1">
            <Clock size={15} className="text-ink-muted" />
            <h2 className="text-sm font-semibold text-text">Activity</h2>
          </div>
          <div className="sheet px-4 sm:px-5">
            <ul className="flex flex-col">
              {activity.slice(0, 8).map((e, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 border-b border-rule py-2.5 text-sm last:border-0"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: toneColor(e.tone) }} />
                    <span className="text-ink">{e.label}</span>
                  </span>
                  <span className="num shrink-0 text-xs text-faint">{timeAgo(e.at)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
