# RuledOff

Chase the close, not your clients. RuledOff finds what's blocking a bookkeeping
client's month-end and chases the **client** (not the bookkeeper) for it — via a
branded, **no-login magic link** they open on their phone. When every item is
answered, the books are *ruled off*.

Built for solo bookkeepers. $29/mo flat, unlimited clients.

## Stack

Next.js 14 (App Router) · TypeScript · Supabase (Postgres, auth, storage) ·
Tailwind (the custom "Ledger" design system) · Resend · Vercel cron.

## Phase 1 (this build)

Bookkeeper auth · client CRUD · per-client close checklist with manual items ·
item state machine (`requested → nudged → answered → accepted`) · the no-login
magic-link client page with text answers + file upload and the "ruled off"
completion moment · Resend chase emails · a daily cron scheduler (day 2/5/9 →
weekly) that escalates by copy and auto-stops when items complete · editable
email templates and firm branding · realistic seed data.

> QuickBooks Online sync, Stripe billing, the dashboard rollup and "text it from
> your phone" land in Phases 2–3.

## Setup

### 1. Environment

Secrets live in `.env.local` (git-ignored — never committed). Required names:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase publishable key
SUPABASE_SECRET_KEY             # Supabase secret/service key (server only)
RESEND_API_KEY
RESEND_FROM                     # onboarding@resend.dev for the sandbox demo
NEXT_PUBLIC_APP_URL             # http://localhost:3000 in dev
CRON_SECRET                     # random; protects the scheduler route
```

### 2. Install

```bash
npm install
```

### 3. Database

Apply the schema once. Either paste it into the Supabase SQL editor:

```bash
npm run migrate:print   # copy the output into Dashboard → SQL → Run
```

…or run `supabase/migrations/0001_init.sql` with the Supabase CLI. This creates
the tables, RLS policies, and the private `attachments` storage bucket.

### 4. Seed demo data

```bash
npm run seed
```

Prints a **bookkeeper login** and a **client magic link** to try both sides.

### 5. Run

```bash
npm run dev            # http://localhost:3000
```

### Testing the scheduler locally

```bash
curl "http://localhost:3000/api/cron/reminders?key=$CRON_SECRET"
```

Returns a JSON report of what was sent / stopped. On Vercel, the cron in
`vercel.json` runs it daily and authenticates via `CRON_SECRET`.

## The one law

The client never creates an account, never logs in, never downloads anything.
Every feature respects that.

## License

See [LICENSE](LICENSE) (TODO).
