-- Phase 3: reminder engine.
--
-- The existing model stays exactly as it is: close_periods.status = 'chasing'
-- drives the sweep, firms.reminder_offsets sets the cadence, and
-- reminders_one_per_day_idx already guarantees at most one reminder per period
-- per day. This migration only adds what that model could not express.

-- 1. Pausing. A bookkeeper can hold the chase for a client without losing the
--    period's state or restarting the cadence when they resume.
alter table public.close_periods
  add column if not exists paused_at timestamptz;

-- 2. Correlating a send with what the provider later tells us about it.
alter table public.reminders
  add column if not exists provider_message_id text;

create index if not exists reminders_provider_message_idx
  on public.reminders (provider_message_id)
  where provider_message_id is not null;

-- 3. Suppression list. A hard bounce or a spam complaint means we must never
--    email that address again: continuing to send is what gets a sending
--    domain blocked, and it is the client's address, not the bookkeeper's, so
--    they cannot fix it themselves. Address is the key, lowercased by the app.
create table if not exists public.email_suppressions (
  email       text primary key,
  reason      text not null check (reason in ('bounce', 'complaint', 'manual')),
  detail      text,
  created_at  timestamptz not null default now()
);

-- 4. Delivery telemetry. One row per thing the provider tells us about a
--    reminder, so "did Sarah's client actually get it" has an answer.
create table if not exists public.reminder_events (
  id           uuid primary key default gen_random_uuid(),
  reminder_id  uuid references public.reminders(id) on delete cascade,
  type         text not null check (type in ('queued', 'sent', 'delivered', 'opened', 'bounced', 'complained', 'failed')),
  detail       text,
  payload      jsonb not null default '{}'::jsonb,
  occurred_at  timestamptz not null default now()
);

create index if not exists reminder_events_reminder_idx
  on public.reminder_events (reminder_id, occurred_at desc);

-- 5. The claim query scans for periods that are due. Index the predicate it
--    filters on so the sweep stays cheap as periods accumulate.
create index if not exists close_periods_chasing_idx
  on public.close_periods (status, chase_started_at)
  where status = 'chasing';

-- RLS stays enabled everywhere; these tables are written only by the backend
-- using the service role, and are never read directly by the browser.
alter table public.email_suppressions enable row level security;
alter table public.reminder_events enable row level security;
