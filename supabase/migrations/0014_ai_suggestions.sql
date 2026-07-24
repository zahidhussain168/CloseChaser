-- Audit log for the AI Close Analyst: what was suggested, per client, so the
-- bookkeeper (and we) can see what the model proposed. Kept simple and
-- append-only; "acted" flips when the bookkeeper takes the one-click action.
create table if not exists ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  suggestion jsonb not null,
  reminders_sent smallint,
  acted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ai_suggestions_client_idx on ai_suggestions (client_id, created_at desc);

alter table ai_suggestions enable row level security;
-- The app reaches this table only via the service role in server actions; no
-- direct client access, so a restrictive default is correct.
