"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useFormState } from "react-dom";
import { Building2, Mail, Phone, Plug, X, UserPlus, ChevronRight } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { createClientAction } from "@/app/(app)/actions";
import { emptyFormState } from "@/lib/forms";

function IconField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Building2;
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink-muted">{label}</span>
      <div className="relative">
        <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        {children}
      </div>
    </label>
  );
}

export function AddClientForm() {
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, action] = useFormState(createClientAction, emptyFormState);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "+";

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        + Add a client
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Add a client">
          <div className="fixed inset-0 bg-[#0b1120]/55 backdrop-blur-md" onClick={() => setOpen(false)} />

          <div className="relative my-auto w-full max-w-md" style={{ animation: "co-rise .22s ease-out both" }}>
            <div className="sheet overflow-hidden rounded-2xl shadow-elev2">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-brand">
                    <UserPlus size={17} />
                  </span>
                  <h2 className="font-display text-lg font-semibold text-text">Add a client</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-2 hover:text-text"
                >
                  <X size={18} />
                </button>
              </div>

              <form action={action} className="flex flex-col gap-4 p-5">
                {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

                {/* Live preview: fills in as they type */}
                <div className="flex items-center gap-3 rounded-xl px-3.5 py-3" style={{ background: "var(--brand-tint)" }}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold text-white" style={{ background: "var(--brand)" }}>
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-text">{name || "New client"}</div>
                    <div className="num truncate text-xs text-ink-muted">{email || "no email yet"}</div>
                  </div>
                </div>

                <IconField icon={Building2} label="Name">
                  <input
                    name="name"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="field pl-10"
                    placeholder="Acme Coffee LLC"
                  />
                </IconField>

                <IconField icon={Mail} label="Email">
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field pl-10"
                    placeholder="owner@acme.co"
                  />
                </IconField>

                <IconField icon={Phone} label="Phone (optional)">
                  <input name="phone" className="field num pl-10" placeholder="(555) 010-0142" />
                </IconField>

                <button
                  type="button"
                  onClick={() => setAdvanced((a) => !a)}
                  className="flex w-fit items-center gap-1 text-sm font-medium text-ink-muted transition-colors hover:text-text"
                >
                  <ChevronRight size={14} className={"transition-transform " + (advanced ? "rotate-90" : "")} />
                  Advanced
                </button>

                {advanced ? (
                  <IconField icon={Plug} label="QuickBooks realm ID (optional)">
                    <input name="qbo_realm_id" className="field num pl-10" placeholder="Leave blank for manual-only" />
                  </IconField>
                ) : (
                  <input type="hidden" name="qbo_realm_id" value="" />
                )}

                <div className="flex items-center gap-3 pt-1">
                  <SubmitButton pendingText="Adding">Add client</SubmitButton>
                  <button type="button" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-muted transition-colors hover:text-text">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
