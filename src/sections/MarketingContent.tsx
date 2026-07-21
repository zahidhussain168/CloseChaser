import { Hero } from "./Hero";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { AppShowcase } from "./AppShowcase";
import { MobileShowcase } from "./MobileShowcase";
import { PricingCTA } from "./PricingCTA";
import { Finale } from "./Finale";
import { SiteFooter } from "@/components/site/SiteFooter";

/** 2026 fintech landing page: hero, features, how-it-works, product and mobile
 *  showcases, pricing CTA, the "Ruled off" climax, footer. */
export function MarketingContent() {
  return (
    <main>
      <Hero />
      <Features />
      <HowItWorks />
      <AppShowcase />
      <MobileShowcase />
      <PricingCTA />
      <Finale />
      <SiteFooter />
    </main>
  );
}
