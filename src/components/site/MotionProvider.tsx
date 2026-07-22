"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "@/animations/motion";

/**
 * Every marketing page animates on the same curve. The marketing motion is a
 * deliberate part of the experience, so it runs regardless of the OS
 * reduced-motion setting (reducedMotion="never"); the product app still honours
 * the preference separately.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="never" transition={{ ease: EASE }}>
      {children}
    </MotionConfig>
  );
}
