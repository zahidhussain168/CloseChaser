"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE, DUR } from "@/animations/motion";

/**
 * Fade + short upward settle when scrolled into view. IntersectionObserver
 * under the hood (framer-motion whileInView), never scroll-jacking. Under
 * prefers-reduced-motion the marketing page's MotionConfig snaps transforms.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 14,
  amount = 0.3,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  amount?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: DUR.base, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
