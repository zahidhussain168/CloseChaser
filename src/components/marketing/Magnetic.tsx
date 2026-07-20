"use client";

import { useRef, type ReactNode } from "react";

/** Wraps a control so it is gently pulled toward the cursor (hover devices only). */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function move(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover)").matches) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  }
  function reset() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline-flex", transition: "transform 220ms var(--ease)" }}
      onMouseMove={move}
      onMouseLeave={reset}
    >
      {children}
    </span>
  );
}
