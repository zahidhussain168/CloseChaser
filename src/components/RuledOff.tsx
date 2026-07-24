import type { ReactNode } from "react";

/**
 * The brand's signature completion moment: when an item is ruled off, a green
 * rule draws through the text (an ink stroke that settles from 2px to 1.5px)
 * while the text softens to muted. Reusable across the product UI and the
 * marketing hero. All motion is CSS (see .ruledoff in globals.css) and respects
 * prefers-reduced-motion.
 *
 * Toggle `done` to true to play the strike. Purely presentational; wrap any
 * inline text (an item title, a hero word) and it inherits the surrounding
 * type.
 */
export function RuledOff({
  children,
  done,
  className,
}: {
  children: ReactNode;
  done: boolean;
  className?: string;
}) {
  return (
    <span className={"ruledoff" + (className ? " " + className : "")} data-done={done ? "true" : "false"}>
      {children}
      <span className="ruledoff-line" aria-hidden="true" />
    </span>
  );
}
