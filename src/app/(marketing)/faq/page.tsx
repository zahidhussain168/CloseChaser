import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Faq } from "@/sections/Faq";
import { JsonLd } from "@/components/site/JsonLd";
import { faqStructuredData } from "@/lib/seo";

const DESC =
  "Answers to common questions about RuledOff: no client logins, automated chasing, QuickBooks, pricing, and security.";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: DESC,
  alternates: { canonical: "/faq" },
  openGraph: { title: "RuledOff FAQ", description: DESC, url: "/faq" },
};

export default function FaqPage() {
  return (
    <main>
      <JsonLd data={faqStructuredData()} />
      <SiteNav />
      <Faq />
      <SiteFooter />
    </main>
  );
}
