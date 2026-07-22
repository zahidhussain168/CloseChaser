/**
 * Shared SEO data. The FAQ list drives both the visible FAQ section and the
 * FAQPage structured data, so the two never drift apart (Google requires the
 * schema to match on-page content). Structured data helpers build the JSON-LD
 * objects injected on the marketing pages.
 */

export const SITE_URL = "https://ruledoff.vercel.app";
export const SITE_NAME = "RuledOff";

export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Does my client need to create an account or log in?",
    a: "No. Your client taps one link and answers on their phone. There is no account, no password, and no app to download. That is the whole point of RuledOff.",
  },
  {
    q: "How does RuledOff chase my clients for me?",
    a: "It sends a calm sequence of emails on your schedule, each one a little firmer than the last, and stops the moment your client sends everything back. You never write another follow-up.",
  },
  {
    q: "Does RuledOff work with QuickBooks Online?",
    a: "Yes. It pulls uncategorized charges and Ask My Accountant entries into your checklist, then posts the answers and receipts back to QuickBooks automatically. You can also import transactions by CSV if you prefer.",
  },
  {
    q: "Can I use RuledOff without QuickBooks?",
    a: "Yes. You can add manual requests for any client, such as a bank statement or a signed W-9, and chase them the same way. QuickBooks is optional.",
  },
  {
    q: "What can I request from a client?",
    a: "Documents to upload, quick explanations for a transaction, and questionnaires that ask several short questions at once. Starter packs cover common jobs like 1099 season and new client onboarding.",
  },
  {
    q: "How much does RuledOff cost?",
    a: "One flat price of 39 dollars a month for unlimited clients and unlimited closes, with every feature included. There is a 14-day free trial and no free tier to outgrow.",
  },
  {
    q: "Is my clients' data secure?",
    a: "Uploads go to a private, encrypted store. Every link expires and can be revoked at any time, and because clients never create accounts there are no passwords to leak.",
  },
];

type JsonLdObject = Record<string, unknown>;

/** All structured data for the marketing home, as a @graph of linked entities. */
export function homeStructuredData(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
        description:
          "RuledOff helps solo bookkeepers close the month by collecting client documents and answers automatically.",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Bookkeeping",
        operatingSystem: "Web",
        url: SITE_URL,
        description:
          "RuledOff collects the documents, receipts, and answers blocking a bookkeeper's month-end close and chases the client automatically until every item is done.",
        offers: {
          "@type": "Offer",
          price: "39.00",
          priceCurrency: "USD",
          category: "subscription",
          url: `${SITE_URL}/pricing`,
        },
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

/** FAQPage schema built from the same FAQ_ITEMS shown on the /faq page. */
export function faqStructuredData(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/faq#faq`,
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
