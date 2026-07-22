"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ArrowRight, Bell } from "lucide-react";
import { requestIntegrationAction } from "@/app/(app)/integration-actions";
import type { IntegrationDef } from "@/lib/integrations";

function Monogram({ item }: { item: IntegrationDef }) {
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold lowercase"
      style={{ background: item.color, color: item.textDark ? "#1A1A1A" : "#FFFFFF" }}
      aria-hidden="true"
    >
      {item.monogram}
    </span>
  );
}

function LiveCard({ item, connected }: { item: IntegrationDef; connected: boolean }) {
  return (
    <div className="sheet flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <Monogram item={item} />
        {connected ? (
          <span className="pill pill-success text-[11px]">
            <Check size={12} /> Connected
          </span>
        ) : (
          <span className="pill pill-brand text-[11px]">Available</span>
        )}
      </div>
      <div>
        <h3 className="text-[15px] font-bold text-text">{item.name}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{item.blurb}</p>
      </div>
      <Link
        href={item.href ?? "#"}
        className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-600"
      >
        {connected ? "Manage" : "Connect"} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function ComingSoonCard({ item, requested }: { item: IntegrationDef; requested: boolean }) {
  const [asked, setAsked] = useState(requested);
  const [pending, start] = useTransition();

  function notify() {
    setAsked(true); // optimistic
    start(async () => {
      const res = await requestIntegrationAction(item.key);
      if (!res.ok) setAsked(requested);
    });
  }

  return (
    <div className="sheet flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="opacity-70">
          <Monogram item={item} />
        </span>
        <span className="pill text-[11px]" style={{ background: "var(--surface-2)", color: "var(--faint)" }}>
          Coming soon
        </span>
      </div>
      <div>
        <h3 className="text-[15px] font-bold text-text">{item.name}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{item.blurb}</p>
      </div>
      {asked ? (
        <span className="mt-auto inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-success">
          <Check size={15} /> We will email you when it is ready
        </span>
      ) : (
        <button
          type="button"
          onClick={notify}
          disabled={pending}
          className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-lg border border-line-strong px-3.5 py-2 text-[13px] font-semibold text-text transition-colors hover:bg-surface-2 disabled:opacity-60"
        >
          <Bell size={14} /> Notify me
        </button>
      )}
    </div>
  );
}

export function IntegrationsGrid({
  integrations,
  connected,
  requested,
}: {
  integrations: IntegrationDef[];
  connected: Record<string, boolean>;
  requested: string[];
}) {
  const requestedSet = new Set(requested);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {integrations.map((item) =>
        item.status === "live" ? (
          <LiveCard key={item.key} item={item} connected={Boolean(connected[item.key])} />
        ) : (
          <ComingSoonCard key={item.key} item={item} requested={requestedSet.has(item.key)} />
        ),
      )}
    </div>
  );
}
