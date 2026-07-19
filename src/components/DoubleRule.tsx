"use client";

import clsx from "clsx";

/**
 * The accountant's double-rule: two close parallel lines meaning "final".
 * When `drawn` is true the lines animate in left-to-right (300ms), unless the
 * viewer prefers reduced motion (handled in CSS).
 */
export function DoubleRule({
  drawn,
  className,
}: {
  drawn: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx("double-rule block", drawn && "is-drawn", className)}
      aria-hidden="true"
    />
  );
}
