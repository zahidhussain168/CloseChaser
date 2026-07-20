import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * CTA button. Primary is the teal brand with a soft glow; secondary is a quiet
 * outline. Depresses 1px on press.
 */
export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold",
        "transition-[transform,background-color,box-shadow,border-color] duration-150 [transition-timing-function:cubic-bezier(.22,1,.36,1)]",
        "active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        size === "lg" ? "min-h-[52px] px-7 text-[16px]" : "min-h-[46px] px-5 text-[15px]",
        variant === "primary"
          ? "bg-brand text-white shadow-brand hover:bg-brand-600"
          : "border border-line-strong bg-surface text-text hover:bg-surface-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}
