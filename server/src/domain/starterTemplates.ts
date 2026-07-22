/**
 * Starter packs: ready-made request templates a bookkeeper can drop in with one
 * click, for the moments that repeat every year. Items use the same shape as
 * template_items (type + title + note). A bookkeeper can edit or trim any item
 * after adding the pack.
 */

export type StarterItem = {
  type: "document" | "transaction";
  title: string;
  note?: string;
};

export type StarterTemplate = {
  key: string;
  name: string;
  blurb: string;
  season: string;
  items: StarterItem[];
};

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    key: "1099-season",
    name: "1099 and W-9 season",
    blurb: "Everything you chase in January to file contractor 1099s on time.",
    season: "Year-end",
    items: [
      {
        type: "document",
        title: "Signed W-9 for each contractor paid over $600",
        note: "One form per contractor. A clear phone photo is fine.",
      },
      {
        type: "document",
        title: "List of contractors and total paid in the year",
        note: "Name and amount for anyone paid $600 or more.",
      },
      {
        type: "transaction",
        title: "Confirm the business legal name and mailing address",
        note: "This is what prints on the 1099 forms.",
      },
      {
        type: "transaction",
        title: "Note any payments made by card or PayPal",
        note: "Those go on a 1099-K from the processor, not from you.",
      },
    ],
  },
  {
    key: "new-client-onboarding",
    name: "New client onboarding",
    blurb: "The first-month starter kit for a brand new client.",
    season: "Onboarding",
    items: [
      {
        type: "document",
        title: "Most recent business bank statement",
        note: "The latest full month, all pages.",
      },
      {
        type: "document",
        title: "Most recent credit card statement",
      },
      {
        type: "document",
        title: "Prior year tax return",
        note: "So the books tie out to what was already filed.",
      },
      {
        type: "document",
        title: "EIN letter or business formation document",
      },
      {
        type: "transaction",
        title: "List your regular vendors and monthly subscriptions",
        note: "Helps set up categories that stick.",
      },
      {
        type: "transaction",
        title: "How do you take payments (Stripe, Square, cash, checks)?",
      },
    ],
  },
  {
    key: "monthly-close-basics",
    name: "Monthly close basics",
    blurb: "The short list you send every single month.",
    season: "Every month",
    items: [
      {
        type: "document",
        title: "Bank statement for the month",
      },
      {
        type: "document",
        title: "Credit card statement for the month",
      },
      {
        type: "transaction",
        title: "Explain any transfers between accounts",
      },
      {
        type: "transaction",
        title: "Flag anything personal that ran through the business",
      },
    ],
  },
];
