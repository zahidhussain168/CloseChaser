# Deploying RuledOff to Vercel

The repo root **is** the Next.js app (no subdirectory), so Vercel auto-detects
everything. Two ways to ship it.

## Option A — Import the Git repo (recommended)

1. In the Vercel account/team that should own the site (e.g. the one behind
   `ruledoff.vercel.app`): **Add New… → Project → Import Git Repository**.
2. Select **`zahidhussain168/CloseChaser`**.
   - Framework preset: **Next.js** (auto-detected)
   - Root Directory: **`./`** (default — the app is at the repo root)
   - Build command / output: **defaults**
3. Add the environment variables below (Project → Settings → Environment
   Variables), then **Deploy**. Every future `git push` to `main` redeploys.

## Option B — Vercel CLI

From the project folder, with a **full-access** token for the target account:

```bash
vercel link         # link/create the project
vercel deploy --prod
```

> Note: the token currently in `api.txt` is for an empty, different account and
> is rejected by the CLI. Use a fresh token from the target account.

## Environment variables

Set these in Vercel (Production, and Preview if you want preview deploys to work):

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ljgpvixnupaijzteesvl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Publishable/anon key for THIS project.** The value currently in local `.env.local` is for a different project and returns `401 Invalid API key` — get the correct one from Supabase → Settings → API keys. |
| `SUPABASE_SECRET_KEY` | Supabase secret key (server only) |
| `RESEND_API_KEY` | Resend key |
| `RESEND_FROM` | `onboarding@resend.dev` for the sandbox |
| `CRON_SECRET` | Long random string; Vercel sends it to the cron route as `Authorization: Bearer …` |
| `NEXT_PUBLIC_APP_URL` | The production URL, e.g. `https://ruledoff.vercel.app`. Used to build magic links — **must be the real domain**, not localhost. |
| `QBO_CLIENT_ID` / `QBO_CLIENT_SECRET` | QuickBooks (Phase 2) |
| `QBO_ENVIRONMENT` | `sandbox` |
| `QBO_REDIRECT_URI` | `https://<your-domain>/api/qbo/callback` (Phase 2) |

Do **not** set `DATABASE_URL`, `GITHUB_TOKEN`, or `VERCEL_API_TOKEN` in Vercel —
they're only for local migration/tooling.

## After the first deploy

1. Set `NEXT_PUBLIC_APP_URL` to the real deployed domain and redeploy (so magic
   links point at production, not localhost).
2. The daily cron in `vercel.json` (`/api/cron/reminders`) runs automatically and
   authenticates via `CRON_SECRET`.
3. The database migration (`supabase/migrations/0001_init.sql`) is already applied
   to the Supabase project; no build-time DB step is needed.
