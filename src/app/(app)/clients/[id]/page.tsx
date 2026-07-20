import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import Link from "next/link";
import { getClientDetail } from "@/lib/data";
import { getActiveToken } from "@/lib/links";
import { createClient } from "@/lib/supabase/server";
import { magicLinkUrl } from "@/lib/tokens";
import { serverEnv } from "@/lib/env";
import { formatMonth, formatMoney, formatDate } from "@/lib/format";
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
  const token = await getActiveToken(supabase, client.id);
  const url = token ? magicLinkUrl(serverEnv.appUrl, token) : null;
  const open = openCount(items);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          ← Clients
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">{client.name}</h1>
            <p className="num mt-1 text-sm text-ink-muted">
              {client.email}
              {client.phone ? ` · ${client.phone}` : ""}
            </p>
          </div>
          <div className="text-right">
            <div className="num text-sm text-ink-muted">
              {formatMonth(period.month)} close
            </div>
            <div
              className="num text-sm"
              style={{
                color:
                  period.status === "closed"
                    ? "var(--cleared)"
                    : open
                      ? "var(--pending)"
                      : "var(--cleared)",
              }}
            >
              {period.status === "closed"
                ? "ruled off"
                : open
                  ? `${open} open`
                  : items.length
                    ? "clear"
                    : "no items"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <MagicLinkBar clientId={client.id} url={url} />
        <ChaseButton
          clientId={client.id}
          openCount={open}
          chasing={period.status === "chasing"}
        />
      </div>

      <section>
        <h2 className="mb-1 font-display text-lg font-semibold">Close checklist</h2>
        {items.length === 0 ? (
          <div className="sheet px-5 py-10 text-center">
            <div className="empty-nib mb-5" aria-hidden="true">
              <span className="line" />
              <span className="nib" />
            </div>
            <p className="font-display">No open items.</p>
            <p className="mt-1 text-sm text-ink-muted">
              Nothing is blocking this close. Add a request below to start one.
            </p>
          </div>
        ) : (
          <div className="border-t" style={{ borderColor: "var(--rule)" }}>
            {items.map((item: Item, idx) => {
              const attachments = (item.attachments ?? []) as Attachment[];
              const accepted = item.state === "accepted";
              return (
                <div key={item.id} className="relative">
                  <div
                    className="ledger-row reveal-row"
                    style={{ ["--i"]: idx } as CSSProperties}
                  >
                    <span className="flex justify-center">
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
                          className="mt-1 block rounded-[4px] px-2 py-1 text-sm"
                          style={{ background: "var(--paper-deep)" }}
                        >
                          “{item.answer_text}”
                        </span>
                      )}
                      {attachments.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-2">
                          {attachments.map((a, i) => (
                            <a
                              key={i}
                              href={`/api/attachments/${item.id}/${i}`}
                              target="_blank"
                              rel="noopener"
                              className="num text-xs underline underline-offset-2"
                              style={{ color: "var(--cleared)" }}
                            >
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
                      className="num text-right text-xs"
                      style={{
                        color: isOpen(item.state)
                          ? "var(--pending)"
                          : "var(--cleared)",
                      }}
                    >
                      {STATE_LABEL[item.state]}
                    </span>
                  </div>
                  {accepted && (
                    <DoubleRule drawn className="mx-1 -mt-px mb-1" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Add a request</h2>
        <AddItemForm clientId={client.id} />
      </section>
    </div>
  );
}
