"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Copy, Send, Plus, MessageSquare, Check, ChevronDown } from "lucide-react";
import { fireChaseAction, regenerateLinkAction } from "@/app/(app)/actions";
import { ProgressRing } from "@/components/site/ProgressRing";

/**
 * The "close cockpit": one command card that consolidates who the client is,
 * how far the close has come, and every action, so the checklist below can be
 * the sole focus. Add forms and the text nudge live behind buttons rather than
 * sitting on screen.
 */
export function CloseCockpit({
  clientId,
  name,
  initials,
  monthLabel,
  statusCls,
  statusText,
  done,
  total,
  fill,
  pct,
  openCount,
  chasing,
  url,
  openedLabel,
  opened,
  email,
  phone,
  books,
  addPanel,
  textPanel,
}: {
  clientId: string;
  name: string;
  initials: string;
  monthLabel: string;
  statusCls: string;
  statusText: string;
  done: number;
  total: number;
  fill: number;
  pct: number;
  openCount: number;
  chasing: boolean;
  url: string | null;
  openedLabel: string | null;
  opened: boolean;
  email: string;
  phone: string | null;
  books: string;
  addPanel: ReactNode;
  textPanel: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [chase, startChase] = useTransition();
  const [regen, startRegen] = useTransition();
  const [chaseMsg, setChaseMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  function doChase() {
    startChase(async () => {
      setChaseMsg(null);
      const res = await fireChaseAction(clientId);
      setChaseMsg(
        res?.ok
          ? { ok: true, text: "Sent. Reminders run automatically." }
          : { ok: false, text: res?.error ?? "Could not send." },
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sheet p-5 sm:p-6">
        {/* Identity + status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-[15px] font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <h1 className="t-h3 truncate font-display font-semibold leading-tight">{name}</h1>
              <p className="num text-sm text-ink-muted">{monthLabel} close</p>
            </div>
          </div>
          <span className={statusCls + " num shrink-0"}>{statusText}</span>
        </div>

        {/* Progress + actions */}
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-line pt-5">
          <ProgressRing value={fill} size={56} stroke={6} label={`${pct}%`} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text">
              {done} of {total} ruled off
            </div>
            <div className="text-xs text-ink-muted">
              {total === 0
                ? "Add items to start this close."
                : openCount
                  ? `${openCount} still waiting on the client.`
                  : "This close is done."}
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {url ? (
              <button type="button" onClick={copyLink} className="btn px-3 text-sm">
                {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                {copied ? "Copied" : "Link"}
              </button>
            ) : null}
            {url && openCount > 0 ? (
              <button
                type="button"
                onClick={() => setTextOpen((v) => !v)}
                className="btn px-3 text-sm"
              >
                <MessageSquare size={15} /> Text
              </button>
            ) : null}
            {openCount > 0 ? (
              <button
                type="button"
                onClick={doChase}
                disabled={chase}
                className="btn btn-primary px-4 text-sm"
              >
                <Send size={15} /> {chase ? "Sending" : chasing ? "Re-send chase" : "Chase"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setAddOpen((v) => !v)}
              className="btn px-3 text-sm"
            >
              <Plus size={15} /> Add
              <ChevronDown
                size={14}
                className={"transition-transform " + (addOpen ? "rotate-180" : "")}
              />
            </button>
          </div>
        </div>

        {chaseMsg ? (
          <p
            className="mt-2 text-xs"
            style={{ color: chaseMsg.ok ? "var(--cleared)" : "var(--pending)" }}
          >
            {chaseMsg.text}
          </p>
        ) : null}

        {/* Quiet meta line */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4 text-xs text-ink-muted">
          {openedLabel ? (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: opened ? "var(--cleared)" : "var(--rule-strong)" }}
              />
              {openedLabel}
            </span>
          ) : null}
          <span className="num">{email}</span>
          {phone ? <span className="num">{phone}</span> : null}
          <span>{books}</span>
          {url ? (
            <button
              type="button"
              disabled={regen}
              onClick={() => {
                if (confirm("Regenerate the link? The old one stops working.")) {
                  startRegen(() => regenerateLinkAction(clientId));
                }
              }}
              className="underline-offset-2 hover:text-ink hover:underline"
            >
              {regen ? "Regenerating" : "Regenerate link"}
            </button>
          ) : null}
        </div>
      </div>

      {textOpen && url ? <div>{textPanel}</div> : null}
      {addOpen ? <div>{addPanel}</div> : null}
    </div>
  );
}
