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

## DESIGN BRIEF — modern fintech (2026 refresh)

### Concept: calm, trustworthy, automated

RuledOff should feel like a modern accounting product a solo bookkeeper is glad to open: clean, confident, and quietly powerful. Draw on the best of Xero (clean sidebar, summary cards, prioritized task lists, status pills), FreshBooks (approachable warmth, simple mobile portals), and 2026 finance dashboards (card-heavy layouts, subtle shadows, progress rings, color-coded priorities). Professional and calm, never loud. The product is named after the accountant's mark for "final" — completing work is getting ruled off, and completion always reads as calm relief, in green.

Note: this supersedes the earlier "Ledger" identity (warm paper, serif, ruled lines). The tokens below are the source of truth; they live in `src/app/globals.css` (`:root` and `.dark`) and `tailwind.config.ts`.

### Tokens

Palette (light; dark variants in `.dark`):

* Brand teal: `#0EA5E9` (primary actions, links, focus), darker `#0284C7`, tints `#E0F2FE` / `#F0F9FF`
* Success green: `#10B981` (ruled off / completed), tint `#D1FAE5`
* Warning amber: `#F59E0B` (pending / waiting), tint `#FEF3C7`
* Danger red: `#EF4444` (overdue only), tint `#FEE2E2`
* Neutrals: bg `#F8FAFC`, surface `#FFFFFF`, surface-2 `#F1F5F9`, border `#E8EDF3`, text `#0F172A`, muted `#64748B`
* Full light + dark mode. Dark: bg `#0B1120`, surface `#131C2E`, brighter teal `#38BDF8`.

Typography:

* Display/headings: "Plus Jakarta Sans" (700/800), tight tracking. Confident, friendly, geometric.
* Body/UI: "Inter".
* Numbers & data: Inter with `tabular-nums` (`.num`). Use for amounts, dates, counts, and progress figures.

Layout:

* Card-heavy. The `.sheet` class is the workhorse surface: white, 1px border, soft shadow, radius 14px. Cards may lift on hover (`.lift`).
* Summary cards at the top of dashboards. Prioritized task lists below. Status pills (`.pill` + `.pill-success|warning|danger|brand`) for state. Progress rings (`ProgressRing`) and gradient progress bars (`.ink-progress`) for completion.
* Generous white space. Mobile-first, fully responsive.

### The signature element: getting ruled off

Completion is the emotional peak and stays green. When an item is accepted, it gets a success tick and a "Ruled off" pill; a subtle double-rule (`.double-rule`, now brand green) can draw in beneath. Progress rings sweep from brand teal to success green as a close fills up. Keep it satisfying and calm, never cartoonish. No confetti.

### Design rules

* Teal is for brand and actions; green means done; amber means pending; red means overdue only, so red keeps its meaning.
* Subtle gradients and soft shadows are welcome (hero wash, CTA bands, progress fills). Avoid heavy neon glows, glassmorphism everywhere, or purple.
* Icons: Lucide, consistent stroke. No emoji in UI.
* Empty states are plain and direct the next action: "No open items. Nothing is blocking this close."
* The bookkeeper app and the client magic-link page share the language, but the client page is even simpler: one column, big touch targets, firm's name at top, zero navigation. The client page respects the firm's saved accent color (`--brass`).

## After each phase

Run the app, screenshot the key screens at desktop and 375px mobile widths, and self-critique against this brief before showing me: does anything look like a default template? Is the mono-numeral ledger identity carried through? Is the ruled-off moment working? Fix, then present.

## Copy rule — no em dashes, anywhere

Remove every em dash (—) and en dash (–) from all user-facing text across the
entire system: UI labels, buttons, empty states, tooltips, error messages, the
magic-link client page, and ALL email templates (every escalation level).
Rewrite each sentence naturally instead: use a period, a comma, or restructure
the sentence. Do not just swap in a hyphen. Hyphens (-) remain allowed in
compound words like "no-login" and in phone/date formatting.

Enforcement: after rewriting, run a grep across the codebase for "—" and "–" in
JSX/TSX strings, email templates, and seed data, and show the zero-match output.
A check runs in the QA step (`npm run check:copy`) and /qa fails if either
character ever appears in rendered UI text again.

## Motion System — "ink on paper"

Every animation mimics ink, paper, and bookkeeping gestures. Durations
150-400ms, ease-out, respect prefers-reduced-motion everywhere.
1. Page/view transitions: content fades up 8px like a page settling.
2. List reveals: checklist rows stagger in 40ms apart, each drawing its bottom
   rule line left-to-right as it appears.
3. The double-rule completion: already specified. Make it flawless. Add a subtle
   ink-bleed effect (the line starts 1.5px, settles to 1px).
4. Numbers: when amounts/counts change, animate with a rolling odometer effect in
   the mono font.
5. Progress: each close period shows a thin ink-fill progress bar that fills like
   a pen stroke, not a CSS gradient slide.
6. Hover states: rows lift ZERO px (no floating). Instead the row's rule line
   darkens and a small posting-column marker inks in.
7. Buttons: press states feel like a stamp, a 1px translate down plus slight ink
   darkening, 100ms.
8. The "Ruled off." completion moment: rows rule off in sequence (80ms stagger),
   then the headline appears with a single confident ink-draw underline. This
   must feel like a ceremony. No confetti.
9. Empty states: a slow, subtle looping animation of a pen nib drawing a rule
   line, in --rule color.
10. Magic-link client page: same system but fewer, faster animations (mobile,
    busy user). Item completion double-rule is the hero there.

Use CSS transitions/keyframes and the Web Animations API; add Framer Motion ONLY
if genuinely needed. Performance budget: no animation may cause layout thrash;
animate transform/opacity/clip-path only.
