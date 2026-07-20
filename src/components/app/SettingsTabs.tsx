"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/settings/plan", label: "Plan" },
  { href: "/settings/branding", label: "Branding" },
  { href: "/settings/connections", label: "Connections" },
  { href: "/settings/reminders", label: "Reminders" },
  { href: "/settings/templates", label: "Templates" },
];

/** Horizontal, scrollable-on-mobile settings sub-nav with a teal active underline. */
export function SettingsTabs() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map((t) => {
        const active = path === t.href || path.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
              active ? "text-brand" : "text-muted hover:text-text",
            )}
          >
            {t.label}
            {active ? (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
