"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { CreditCard, Palette, Plug, Clock, LayoutList, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/settings/plan", label: "Plan", Icon: CreditCard },
  { href: "/settings/branding", label: "Branding", Icon: Palette },
  { href: "/settings/connections", label: "Connections", Icon: Plug },
  { href: "/settings/reminders", label: "Reminders", Icon: Clock },
  { href: "/settings/templates", label: "Templates", Icon: LayoutList },
];

/**
 * Settings sub-nav as a segmented control: an icon + label per tab on a soft
 * track, the active tab lifted onto a white pill. Scrolls horizontally on
 * mobile. Matches the segmented tabs used elsewhere in the app.
 */
export function SettingsTabs() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
      {TABS.map((t) => {
        const active = path === t.href || path.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              active ? "bg-surface text-text shadow-sm" : "text-ink-muted hover:text-text",
            )}
          >
            <t.Icon size={16} className={active ? "text-brand" : ""} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
