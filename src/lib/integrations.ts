/**
 * The integrations catalog shown on /integrations. QuickBooks Online is live;
 * the rest are on the roadmap and let a firm register interest so we can email
 * them at launch and rank demand. Order and selection follow real demand in the
 * bookkeeper close/collection space (Xero, Zapier, storage, email-send, Dext,
 * Slack/Teams lead).
 */
export type IntegrationStatus = "live" | "coming_soon";

export type IntegrationCategory =
  | "Accounting"
  | "Automation"
  | "Communication"
  | "Email"
  | "Storage"
  | "Receipts"
  | "Payments";

export type IntegrationDef = {
  key: string;
  name: string;
  blurb: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  /** Tile background for the monogram badge. */
  color: string;
  /** Dark text on light tiles (e.g. Dext yellow). */
  textDark?: boolean;
  monogram: string;
  /** Where a live integration is managed. */
  href?: string;
};

export const INTEGRATIONS: IntegrationDef[] = [
  {
    key: "quickbooks",
    name: "QuickBooks Online",
    blurb:
      "Pull uncategorized and Ask My Accountant transactions into the checklist, then post answers and receipts back.",
    category: "Accounting",
    status: "live",
    color: "#2CA01C",
    monogram: "qb",
    href: "/settings/connections",
  },
  {
    key: "xero",
    name: "Xero",
    blurb: "Two-way sync so the same close workflow runs for your Xero clients.",
    category: "Accounting",
    status: "coming_soon",
    color: "#13B5EA",
    monogram: "xo",
  },
  {
    key: "zapier",
    name: "Zapier",
    blurb: "Connect RuledOff to thousands of apps. Trigger on client responses and cleared closes.",
    category: "Automation",
    status: "coming_soon",
    color: "#FF4A00",
    monogram: "Z",
  },
  {
    key: "slack",
    name: "Slack",
    blurb: "A ping in your channel the moment a client responds or a close is ruled off.",
    category: "Communication",
    status: "coming_soon",
    color: "#611F69",
    monogram: "S",
  },
  {
    key: "teams",
    name: "Microsoft Teams",
    blurb: "The same alerts in Teams for Microsoft-first firms.",
    category: "Communication",
    status: "coming_soon",
    color: "#6264A7",
    monogram: "T",
  },
  {
    key: "gmail",
    name: "Gmail",
    blurb: "Send chases from your own Gmail so they land in the inbox, not spam.",
    category: "Email",
    status: "coming_soon",
    color: "#EA4335",
    monogram: "G",
  },
  {
    key: "outlook",
    name: "Outlook",
    blurb: "Send from your Microsoft 365 address and turn client replies into tasks.",
    category: "Email",
    status: "coming_soon",
    color: "#0A6ED1",
    monogram: "O",
  },
  {
    key: "google_drive",
    name: "Google Drive",
    blurb: "Auto-file collected documents into the client's Drive folder.",
    category: "Storage",
    status: "coming_soon",
    color: "#1FA463",
    monogram: "D",
  },
  {
    key: "dropbox",
    name: "Dropbox",
    blurb: "Save every uploaded receipt and statement straight to Dropbox.",
    category: "Storage",
    status: "coming_soon",
    color: "#0061FF",
    monogram: "Db",
  },
  {
    key: "dext",
    name: "Dext",
    blurb: "Route captured receipts and bills between Dext and your checklist.",
    category: "Receipts",
    status: "coming_soon",
    color: "#FFCD00",
    textDark: true,
    monogram: "Dx",
  },
  {
    key: "stripe",
    name: "Stripe",
    blurb: "Collect a payment or deposit on a request, right from the portal.",
    category: "Payments",
    status: "coming_soon",
    color: "#635BFF",
    monogram: "St",
  },
  {
    key: "quickbooks_desktop",
    name: "QuickBooks Desktop",
    blurb: "Sync with QuickBooks Desktop via Web Connector for firms still on Desktop.",
    category: "Accounting",
    status: "coming_soon",
    color: "#2CA01C",
    monogram: "qd",
  },
];

export const INTEGRATION_KEYS = new Set(INTEGRATIONS.map((i) => i.key));
