import type { Variants } from "framer-motion";

/**
 * Shared motion language: "paper settling on a desk."
 * No spring, no bounce, no overshoot. One ease, short durations.
 */
export const EASE: [number, number, number, number] = [0.25, 0.8, 0.25, 1];

export const DUR = { fast: 0.2, base: 0.32, slow: 0.45 } as const;

/** Gentle fade + short upward settle. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
};

/** Container that staggers its children in like items settling one by one. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
