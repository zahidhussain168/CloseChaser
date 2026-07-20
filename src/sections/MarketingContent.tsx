import { Hero } from "./Hero";
import { Contrast } from "./Contrast";
import { Phone } from "./Phone";
import { Timeline } from "./Timeline";
import { DashboardSection } from "./DashboardSection";
import { Finale } from "./Finale";
import { SiteFooter } from "@/components/site/SiteFooter";

/**
 * One sustained scroll arc: the page starts busy (the hero checklist) and gets
 * calmer as you descend, until the single "Ruled off" climax. Reduced-motion
 * handling comes from the marketing layout's MotionProvider.
 */
export function MarketingContent() {
  return (
    <main>
      <Hero />
      <Contrast />
      <Phone />
      <Timeline />
      <DashboardSection />
      <Finale />
      <SiteFooter />
    </main>
  );
}
