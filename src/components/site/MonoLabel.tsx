import clsx from "clsx";
import type { ReactNode } from "react";

/** A small Geist Mono eyebrow label. */
export function MonoLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "font-geist text-[11px] uppercase tracking-[0.22em] text-site-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}
