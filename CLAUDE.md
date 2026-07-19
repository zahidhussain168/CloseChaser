# RuledOff — Project Brief for Claude Code

## What this is

RuledOff is a micro-SaaS for solo bookkeepers. It connects to a client's QuickBooks Online, detects what's blocking the month-end close (uncategorized transactions, "Ask My Accountant" entries, missing receipts/statements/W-9s), and automatically chases the bookkeeper's CLIENT via email with a branded, no-login magic link until every item is resolved — until the books are ruled off.

The buyer is the bookkeeper (pays $29/mo flat, unlimited clients). The end user of the magic-link page is the bookkeeper's client — a busy small-business owner on their phone.

## The one law of this product

THE CLIENT NEVER CREATES AN ACCOUNT, NEVER LOGS IN, NEVER DOWNLOADS ANYTHING. Every incumbent tool dies because clients refuse portals and logins. The magic link opens a mobile-first checklist; the client answers/uploads; done. If any feature would require the client to log in, the feature is wrong.

## Environment & secrets

A `.env.local` file exists in the project root with Supabase, Resend, and QBO sandbox credentials. Read the variable NAMES from it and reference them in code via process.env — but NEVER print their values, never hardcode them, never commit the file. Before the first git commit, confirm `.gitignore` covers `.env.local` and `.env*.local`.

## Stack (use exactly this)

* Next.js 14+ (App Router) + TypeScript
* Supabase (Postgres, bookkeeper auth, file storage)
* Tailwind CSS with the custom design tokens below (NOT default Tailwind look)
* Resend for reminder emails
* intuit-oauth + node-quickbooks (or plain fetch against QBO v3 REST API)
* Vercel cron for the daily reminder scheduler
* Stripe Checkout + customer portal for billing

## Users & flows

1. BOOKKEEPER (authenticated app):
   * Signs up, connects QBO via OAuth (sandbox creds in .env for now)
   * Adds clients (name, email, phone). Each client maps to a QBO realm OR is manual-only (no QBO) — support both from day one
   * Sees per-client "Close Checklist": auto-detected items from QBO + manually added requests ("December bank statement", "W-9 for vendor X")
   * Fires off a chase: system emails the client a magic link, then auto-reminds on a schedule (day 2, day 5, day 9, then weekly) and STOPS automatically the moment items complete
   * Reminder escalation is done through COPY, not channel: friendly (day 2) → specific with a deadline (day 5) → consequence-framed ("your books can't close without these; late books mean late taxes", day 9). Build these as per-level email templates the bookkeeper can lightly edit.
   * Dashboard: all clients, sorted by "most blocking the close"
   * Answers write back to QBO (update category/memo, attach uploaded doc)
2. CLIENT (magic link, no auth):
   * Opens link on phone → sees firm-branded checklist
   * For a transaction: sees date/amount/payee, types what it was, optionally snaps a photo of the receipt
   * For a document request: uploads file(s)
   * Progress saves instantly per item (no submit-all button). Closing the tab loses nothing.
   * When everything is done: the "ruled off" completion moment (see Design)

## Build order (phases — finish one, show me, then continue)

* PHASE 1: Auth, client CRUD, manual checklist items, magic-link client page with file upload + text answers, item state machine (requested → nudged → answered → accepted), Resend email send + daily cron reminders with auto-stop and the 3-level escalation copy. Seed with realistic demo data.
* PHASE 2: QBO OAuth (sandbox), pull uncategorized + "Ask My Accountant" transactions into the checklist, write answers/attachments back to QBO. Build a CSV-import fallback (bookkeeper exports transactions from QBO and uploads) so the product demos even without API review.
* PHASE 3: Dashboard rollup ("what's blocking close this week"), Stripe billing ($29/mo, 14-day trial, no free plan), email domain branding (send-as firm name), reminder-cadence settings, AND the "text it from your phone" feature: for any pending chase, generate the reminder message (with magic link) and give the bookkeeper a one-tap "Copy & text to [client]" button (sms: deep link on mobile with prefilled body where supported; clipboard copy on desktop). Texts come from the bookkeeper's own number — a selling point, not a workaround.
* PHASE 4 (do not build; leave clean seams only): app-sent SMS via a provider, Xero connector. The reminder system must stay channel-agnostic internally so a second channel can plug in later.

## Data model (adjust as needed, but start here)

* firms (bookkeeper account, branding: name, logo, accent color, reply-to)
* clients (firm_id, name, email, phone, qbo_realm_id nullable)
* close_periods (client_id, month, status)
* items (close_period_id, type: transaction|document, source: qbo|manual, qbo_txn_id nullable, title, details jsonb, state, answer_text, attachments[], answered_at)
* magic_links (client_id, token, expires_at, last_opened_at)
* reminders (item batch, channel: email|manual_text, scheduled_for, sent_at, stopped_reason)

## Security & quality bar

* Magic-link tokens: long random, single-client scope, 30-day expiry, regenerate on demand; rate-limit the public routes
* Files: Supabase storage, private bucket, signed URLs
* Never expose QBO tokens client-side; encrypt refresh tokens at rest
* Mobile-first on the client page: test at 375px width first
* Accessible: visible focus states, labels on all inputs, prefers-reduced-motion respected
* Plain-language UI copy everywhere: "Send it back to Sarah" not "Submit response"

## Explicitly DO NOT build

Client accounts/logins/portal. OCR. E-signatures. Proposals. CRM. Time tracking. Per-client billing logic. Chat. Native apps. App-sent SMS (no A2P registration available). If I ask for any of these later, remind me why they're excluded.

## DESIGN BRIEF — this must NOT look like a generic SaaS template

### Concept: "The Ledger"

The visual world of RuledOff is the physical accounting ledger — the pale-green columnar paper, ruled lines, red ink for outstanding items, and the accountant's double-rule (double underline) that means "this total is final." The design should feel like beautiful, modern ledger paper come to life — calm, precise, trustworthy — not like a startup dashboard. The product is literally named after this mark: completing work = getting ruled off.

### Tokens

Palette (use these, derive shades from them):

* --paper: #F2F5EF (pale ledger-green paper — app background)
* --ink: #232A25 (near-black green-ink — primary text)
* --rule: #C9D6C6 (the ruled lines of ledger paper — borders/dividers)
* --pending: #B3402E (accountant's red ink — outstanding/overdue items ONLY)
* --cleared: #2F6B4F (deep ledger green — completed/reconciled states)
* --brass: #A88B4C (brass paper-fastener accent — used sparingly: focus rings, the active nav marker, small details)

Typography:

* Display/headings: "Fraunces" (Google Fonts) — warm, slightly old-style, used at heavy weights sparingly (page titles, the completion moment)
* Body/UI: "Inter" — quiet and legible
* Numbers & data: "IBM Plex Mono" with tabular numerals — every amount, date, and count renders in mono, like ledger entries. This is a core part of the identity, not a garnish.

Layout:

* Horizontal ruled lines (1px --rule) structure lists the way ledger paper does: rows sit ON rules, generous vertical rhythm, almost no cards or drop shadows. Where a card is unavoidable, it's a flat sheet with a 1px rule border, radius 6px max.
* Left column of each checklist row is a narrow "posting column" holding the item's status mark, like the tick column in a real ledger.

### The signature element: getting ruled off

When an item is completed, it receives the accountant's double-rule: two close parallel lines drawn beneath the row (animate them drawing left-to-right, ~300ms, ease-out; skip animation under prefers-reduced-motion), the amount/date flips from red ink to --cleared, and a small hand-drawn-style check appears in the posting column. When ALL items in a close period are done, the client page plays the full moment: every row rules off in sequence, then a Fraunces headline — "Ruled off." — with a one-line sub: "Your books for [Month] are closed." and the period's item count double-ruled beneath it. This moment IS the brand; make it feel earned and satisfying, not cartoonish. No confetti.

### Design restraint rules

* The double-rule moment is the ONE place the design shows off. Everything else stays quiet: no gradients, no glassmorphism, no purple, no floating blobs, no drop-shadow stacks, no emoji in UI.
* Red ink (--pending) appears only on genuinely outstanding/overdue things, so it keeps its meaning.
* Empty states use ledger vernacular and direct the next action: "No open items. Nothing is blocking this close."
* The bookkeeper app and the client magic-link page share the same design language, but the client page is even simpler: one column, big touch targets, firm's name at top, zero navigation.

## After each phase

Run the app, screenshot the key screens at desktop and 375px mobile widths, and self-critique against this brief before showing me: does anything look like a default template? Is the mono-numeral ledger identity carried through? Is the ruled-off moment working? Fix, then present.
