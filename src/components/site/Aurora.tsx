"use client";

import { motion } from "framer-motion";

type Blob = { cls: string; size: number; left: string; top: string };

const SETS: Record<"brand" | "dark", Blob[]> = {
  brand: [
    { cls: "bg-brand/15", size: 460, left: "8%", top: "-6%" },
    { cls: "bg-success/12", size: 380, left: "62%", top: "20%" },
    { cls: "bg-brass/10", size: 320, left: "38%", top: "55%" },
  ],
  dark: [
    { cls: "bg-brand/25", size: 520, left: "14%", top: "8%" },
    { cls: "bg-brass/14", size: 360, left: "66%", top: "42%" },
  ],
};

/**
 * A living background: soft gradient blobs that drift and breathe slowly.
 * Driven by framer-motion (not CSS keyframes) so it animates on the marketing
 * page under the site's MotionProvider, which is set to animate regardless of
 * the OS reduced-motion setting. Purely decorative and non-interactive.
 */
export function Aurora({ variant = "brand" }: { variant?: "brand" | "dark" }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {SETS[variant].map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[90px] ${b.cls}`}
          style={{ width: b.size, height: b.size, left: b.left, top: b.top }}
          animate={{
            x: [0, 34, -22, 0],
            y: [0, -26, 18, 0],
            scale: [1, 1.14, 0.94, 1],
          }}
          transition={{
            duration: 18 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
