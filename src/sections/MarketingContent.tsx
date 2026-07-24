import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { MobileShowcase } from "./MobileShowcase";
import { AppShowcase } from "./AppShowcase";
import { TrustBlock } from "./TrustBlock";
import { FounderStory } from "./FounderStory";
import { ProofStrip } from "./ProofStrip";
import { PricingCTA } from "./PricingCTA";
import { Finale } from "./Finale";
import { SiteFooter } from "@/components/site/SiteFooter";
import { JsonLd } from "@/components/site/JsonLd";
import { homeStructuredData } from "@/lib/seo";

/**
 * Six-section landing page, built as a deliberate light/dark rhythm rather than
 * a scroll of similar blocks:
 *   1. Hero              light  (brand-wash gradient)
 *   2. How it works      light  (flat paper) + merged product capabilities
 *   3. Client experience DARK   (deep navy stage for the phone mockup)
 *   4. Bookkeeper view   light  (ivory) with the client-list mockup as focal point
 *   5. Pricing           light  (flat paper, gradient card)
 *   6. Ruled off finale  DARKEST (near-black, near-empty payoff)
 * FAQ moved to /faq; structured data (Organization, WebSite, SoftwareApplication)
 * for search and AI engines.
 */
export function MarketingContent() {
  return (
    <main>
      <JsonLd data={homeStructuredData()} />
      <Hero />
      <ProofStrip />
      <HowItWorks />
      <MobileShowcase />
      <AppShowcase />
      <TrustBlock />
      <FounderStory />
      <ProofStrip />
      <PricingCTA />
      <Finale />
      <SiteFooter />
    </main>
  );
}
