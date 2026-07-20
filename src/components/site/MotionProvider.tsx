"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "@/animations/motion";

/**
 * Every marketing page animates on the same curve and honours
 * prefers-reduced-motion by snapping transforms straight to their end state.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE }}>
      {children}
    </MotionConfig>
  );
}
