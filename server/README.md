# RuledOff API

Standalone **Express + TypeScript** backend for RuledOff, extracted from the
Next.js app. It talks to the **same Supabase Postgres** (no new database), so it
is a drop-in API the frontend can call instead of the in-app server actions.

## Architecture

```
src/
  index.ts            server bootstrap (listen, graceful shutdown)
  app.ts              express app: security, CORS, body parsing, route mounting
  config/env.ts       zod-validated environment
  lib/                supabase clients, errors, logger
  middleware/         requireAuth (Supabase JWT + RLS), validate (zod),
                      errorHandler, rateLimit, asyncHandler
  domain/             pure logic: item state machine, reminder cadence, types
  services/           firms/clients/items data, links (magic tokens), chase +
                      email + resend, scheduler, portal, ai, qbo, paddle
  routes/             one router per resource
```

**Auth model.** Clients send a Supabase **access token** as `Authorization:
Bearer <token>`. `requireAuth` verifies it, builds a per-request Supabase client
bound to that token (so **Row Level Security** scopes every query to the caller),
and resolves the caller's firm. Trusted paths (portal, cron, webhooks) use the
service-role client, scoped by magic-link token / secret / signature instead.

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health`, `/api/health/ready` | none | liveness / DB readiness |
| POST | `/api/auth/signup` | none | create firm account |
| POST | `/api/auth/login` | none | email + password -> session |
| GET | `/api/auth/me` | bearer | current user + firm |
| GET | `/api/clients` | bearer | list clients |
| POST | `/api/clients` | bearer | create client |
| GET/PATCH/DELETE | `/api/clients/:id` | bearer | read / update / delete |
| GET | `/api/clients/:id/checklist` | bearer | current close: period, items, link |
| POST | `/api/clients/:id/items` | bearer | add document / transaction / questionnaire |
| POST | `/api/clients/:id/chase` | bearer | start chasing + send initial email |
| GET | `/api/clients/:id/link` | bearer | active magic link |
| POST | `/api/clients/:id/link/regenerate` | bearer | revoke + reissue link |
| DELETE | `/api/items/:id` | bearer | delete item |
| POST | `/api/items/:id/accept` | bearer | rule off (accept) |
| POST | `/api/items/:id/reopen` | bearer | send back to client |
| GET | `/api/c/:token` | token | client portal checklist (no login) |
| POST | `/api/c/:token/answer` | token | answer an item |
| POST | `/api/c/:token/upload` | token | upload a file (multipart `file`) |
| GET/POST | `/api/cron/reminders` | secret | run the escalation scheduler |
| POST | `/api/ai/generate-emails` | bearer | draft the 5 chase emails |
| POST | `/api/ai/save-emails` | bearer | save them as firm templates |
| GET | `/api/qbo/connect` | bearer | Intuit consent URL |
| GET | `/api/qbo/callback` | signed state | OAuth token exchange |
| GET | `/api/qbo/status` | bearer | connection status |
| DELETE | `/api/qbo` | bearer | disconnect QuickBooks |
| POST | `/api/paddle/webhook` | signature | billing events (raw body) |

## Run

```bash
cd server
npm install
cp .env.example .env   # fill in Supabase + secrets
npm run dev            # tsx watch, http://localhost:4000
# or
npm run build && npm start
```

Health check: `curl localhost:4000/health`

Add `POST /api/qbo/import` (body `{ clientId }`) to pull this month's blocking
transactions into the close, and item accept auto-writes the answer + receipts
back to QuickBooks for QBO-sourced items.

## Notes

- QuickBooks is fully ported: OAuth, encrypted tokens (identical `v1` AES-256-GCM
  format as the app, so both services read the same `qbo_connections`),
  transaction pull, and memo + attachment write-back on accept.
- The scheduler is stateless; drive `POST /api/cron/reminders` from any cron
  (Vercel Cron, GitHub Actions, a container cron) once a day with the secret.
- Copy rule (no em/en dashes) is enforced in the AI output by `services/ai.ts`.
