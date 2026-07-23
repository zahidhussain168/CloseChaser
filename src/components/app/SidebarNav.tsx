"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function PlugIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22v-5" />
      <path d="M9 8V2M15 8V2" />
      <path d="M18 8v3a6 6 0 0 1-12 0V8z" />
    </svg>
  );
}
function StackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

const ITEMS = [
  { href: "/dashboard", label: "Clients", Icon: UsersIcon },
  { href: "/integrations", label: "Integrations", Icon: PlugIcon },
  { href: "/settings/templates", label: "Templates", Icon: StackIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon },
];

export function SidebarNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const path = usePathname();
  // Highlight only the most specific matching item (so /settings/templates
  // lights up Templates, not Settings).
  const activeHref = ITEMS.filter(
    (it) => path === it.href || (it.href !== "/dashboard" && path.startsWith(it.href)),
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className={clsx("flex gap-1", orientation === "vertical" ? "flex-col" : "flex-row")}>
      {ITEMS.map(({ href, label, Icon }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "group relative flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
              active ? "text-brand" : "text-muted hover:bg-surface-2 hover:text-text",
            )}
            style={active ? { background: "var(--brand-tint)" } : undefined}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-brand"
              />
            )}
            <Icon />
            {/* Full label in the desktop sidebar; icon-only in the compact
                mobile top bar (label kept for screen readers). */}
            <span className={orientation === "horizontal" ? "sr-only" : "font-medium"}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
