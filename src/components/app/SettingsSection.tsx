import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Consistent premium header + body for a settings sub-page: an accent icon
 * tile, a display title, and a muted description, above the section's cards.
 */
export function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-start gap-3.5">
        {Icon ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
            <Icon size={20} />
          </span>
        ) : null}
        <div>
          <h2 className="t-h3 font-display font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}
