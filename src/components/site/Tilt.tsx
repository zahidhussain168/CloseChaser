"use client";

import { useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Simple 3D tilt: the element leans toward the pointer using CSS perspective,
 * giving depth without WebGL. Pointer updates are rAF-throttled, it eases back
 * to flat on leave, and it only engages on hover-capable (desktop) pointers so
 * touch scrolling is never affected. Inline transform, so it is unaffected by
 * the global reduced-motion CSS.
 */
export function Tilt({
  children,
  className,
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees on each axis. */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    });
  }

  function reset() {
    cancelAnimationFrame(frame.current);
    const el = ref.current;
    if (el) el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={className}
      style={{ transition: "transform 350ms cubic-bezier(0.22,1,0.36,1)", transformStyle: "preserve-3d", willChange: "transform" }}
    >
      {children}
    </div>
  );
}
