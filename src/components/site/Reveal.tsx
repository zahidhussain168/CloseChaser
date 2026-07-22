"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll reveal: content rises 64px, scales up from 0.94, and fades in as it
 * enters the viewport. Uses framer-motion's whileInView (IntersectionObserver),
 * which reveals reliably in the browser. The marketing MotionProvider forces
 * this to run even under reduced-motion, since the motion is a deliberate part
 * of the page. `animation`/`duration` are accepted for source compatibility.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 64,
  amount = 0.2,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  amount?: number;
  animation?: string;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
