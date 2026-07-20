"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { StatusMark } from "@/components/StatusMark";
import { DoubleRule } from "@/components/DoubleRule";

type PortalItem = {
  id: string;
  type: "transaction" | "document";
  title: string;
  note: string | null;
  meta: string | null;
  state: "requested" | "nudged" | "answered" | "accepted";
  answer_text: string | null;
  attachments: { name: string }[];
};

type RowState = PortalItem & { saving: boolean; error: string | null; ruled: boolean };

function isDone(s: string) {
  return s === "answered" || s === "accepted";
}

export function PortalChecklist({
  token,
  monthLabel,
  items: initial,
}: {
  token: string;
  monthLabel: string;
  items: PortalItem[];
}) {
  const [items, setItems] = useState<RowState[]>(
    initial.map((i) => ({ ...i, saving: false, error: null, ruled: isDone(i.state) })),
  );

  const patch = (id: string, next: Partial<RowState>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...next } : it)));

  const allDone = useMemo(
    () => items.length > 0 && items.every((i) => isDone(i.state)),
    [items],
  );
  const doneCount = items.filter((i) => isDone(i.state)).length;

  async function submitAnswer(id: string, text: string) {
    const item = items.find((i) => i.id === id);
    if (!item || item.state === "accepted") return;
    if ((text.trim() || "") === (item.answer_text ?? "")) return; // no change
    patch(id, { saving: true, error: null });
    try {
      const res = await fetch(`/api/client/${token}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      patch(id, {
        saving: false,
        answer_text: data.answer_text ?? null,
        state: data.state,
        ruled: isDone(data.state),
      });
    } catch (e) {
      patch(id, { saving: false, error: e instanceof Error ? e.message : "Error" });
    }
  }

  async function uploadFiles(id: string, files: FileList) {
    const item = items.find((i) => i.id === id);
    if (!item || item.state === "accepted") return;
    for (const file of Array.from(files)) {
      patch(id, { saving: true, error: null });
      const fd = new FormData();
      fd.append("itemId", id);
      fd.append("file", file);
      try {
        const res = await fetch(`/api/client/${token}/upload`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        patch(id, {
          saving: false,
          attachments: data.attachments ?? [],
          state: data.state,
          ruled: isDone(data.state),
        });
      } catch (e) {
        patch(id, { saving: false, error: e instanceof Error ? e.message : "Error" });
      }
    }
  }

  if (allDone) {
    return <CompletionMoment monthLabel={monthLabel} count={items.length} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[15px] leading-relaxed text-ink-muted">
          A few things to wrap up <span className="num">{monthLabel}</span>.
          Answer what you can. It saves as you go, and you can come back anytime.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span
            className="ink-progress block h-1.5 flex-1"
            style={{ ["--fill"]: items.length ? doneCount / items.length : 0 } as CSSProperties}
            aria-hidden="true"
          >
            <span />
          </span>
          <span className="num text-xs text-ink-muted">
            {doneCount}/{items.length} done
          </span>
        </div>
      </div>

      <div className="sheet overflow-hidden px-4 sm:px-5">
        {items.map((item, idx) => (
          <PortalRow
            key={item.id}
            index={idx}
            item={item}
            onAnswer={(text) => submitAnswer(item.id, text)}
            onUpload={(files) => uploadFiles(item.id, files)}
          />
        ))}
      </div>
    </div>
  );
}

function PortalRow({
  item,
  index,
  onAnswer,
  onUpload,
}: {
  item: RowState;
  index: number;
  onAnswer: (text: string) => void;
  onUpload: (files: FileList) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(item.answer_text ?? "");
  const done = isDone(item.state);
  const locked = item.state === "accepted";

  return (
    <div
      className="reveal-row relative py-4"
      style={{ ["--i"]: index } as CSSProperties}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex w-6 justify-center">
          <StatusMark state={item.state} animate={item.ruled} />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="text-[16px] font-medium leading-snug"
            style={done ? { color: "var(--cleared)" } : undefined}
          >
            {item.title}
          </div>
          {item.meta && (
            <div className="num mt-0.5 text-xs text-ink-muted">{item.meta}</div>
          )}
          {item.note && (
            <div className="mt-0.5 text-sm text-ink-muted">{item.note}</div>
          )}

          {!locked && (
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={() => onAnswer(text)}
                rows={2}
                aria-label={
                  item.type === "transaction"
                    ? `What was this charge: ${item.title}`
                    : `A note for: ${item.title}`
                }
                placeholder={
                  item.type === "transaction"
                    ? "What was this? (e.g. office supplies from Staples)"
                    : "Add a note (optional)"
                }
                className="field text-[16px]"
              />

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files?.length) onUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn min-h-[44px] px-4"
                >
                  {item.type === "document" ? "Add photo or file" : "Attach receipt"}
                </button>
                {item.saving && (
                  <span className="text-sm text-ink-muted">Saving…</span>
                )}
              </div>
            </div>
          )}

          {item.attachments.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {item.attachments.map((a, i) => (
                <li
                  key={i}
                  className="num inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
                  style={{ background: "var(--success-tint)", color: "var(--success)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  {a.name}
                </li>
              ))}
            </ul>
          )}
          {item.error && (
            <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
              {item.error}
            </p>
          )}
        </div>
      </div>
      {done && <DoubleRule drawn={item.ruled} className="ml-9 mt-3" />}
    </div>
  );
}

function CompletionMoment({
  monthLabel,
  count,
}: {
  monthLabel: string;
  count: number;
}) {
  return (
    <div className="flex flex-col items-center py-16 text-center animate-fadein">
      <div className="inline-block">
        <h2
          className="font-display text-5xl font-semibold"
          style={{ color: "var(--ink)" }}
        >
          Ruled off.
        </h2>
        <span className="ink-underline mt-1" aria-hidden="true" />
      </div>
      <p className="mt-4 text-[15px] text-ink-muted">
        Your books for <span className="num">{monthLabel}</span> are closed.
      </p>
      <div className="mt-8 w-40">
        <div className="num text-center text-3xl" style={{ color: "var(--cleared)" }}>
          {count}
        </div>
        <div className="mt-1 text-center text-xs text-ink-muted">
          item{count === 1 ? "" : "s"} settled
        </div>
        <div className="double-rule is-drawn mt-2" aria-hidden="true" />
      </div>
      <p className="mt-10 text-sm text-ink-muted">
        You&apos;re all done here. You can close this page.
      </p>
    </div>
  );
}
