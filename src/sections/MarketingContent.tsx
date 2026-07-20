"use client";

import { MotionConfig } from "framer-motion";
import { EASE } from "@/animations/motion";
import { Hero } from "./Hero";
import { Contrast } from "./Contrast";
import { Phone } from "./Phone";
import { Timeline } from "./Timeline";
import { DashboardSection } from "./DashboardSection";
import { Finale } from "./Finale";
import { SiteFooter } from "@/components/site/SiteFooter";

/**
 * One sustained scroll arc: the page starts busy (the hero checklist) and gets
 * calmer as you descend, until the single "Ruled off" climax. MotionConfig makes
 * every child respect prefers-reduced-motion by snapping transforms to the end.
 */
export function MarketingContent() {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE }}>
      <main>
        <Hero />
        <Contrast />
        <Phone />
        <Timeline />
        <DashboardSection />
        <Finale />
        <SiteFooter />
      </main>
    </MotionConfig>
  );
}
