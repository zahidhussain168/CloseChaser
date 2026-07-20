import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * Editorial CTA. Depresses like a physical button (1px down on press), no
 * bounce. Primary is ink-on-paper; secondary is a quiet outline.
 */
export function Button({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[7px] px-6 text-[15px] font-medium",
        "transition-[transform,background-color,box-shadow] duration-200 [transition-timing-function:cubic-bezier(.25,.8,.25,1)]",
        "active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-green",
        variant === "primary"
          ? "bg-site-ink text-site-white shadow-[0_2px_0_rgba(17,19,21,0.18)] hover:bg-[#1c1f22] active:shadow-none"
          : "border border-site-border bg-site-white text-site-ink hover:bg-site-paper",
        className,
      )}
    >
      {children}
    </Link>
  );
}
