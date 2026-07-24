-- Phase 4: order-safe billing.
--
-- Paddle guarantees delivery, not order, and it retries. Both of those are
-- normal, and both are dangerous when the payload decides whether someone can
-- use the product they paid for: a retried 'canceled' or a late 'updated' can
-- overwrite a newer 'active' and lock a paying firm out of their own account.
--
-- Two columns fix it. The event id makes replays idempotent, and the event's
-- own occurred_at makes stale events detectable.

-- Every webhook we have ever accepted. Primary key is Paddle's event id, so a
-- retry collides instead of applying twice. Kept as an audit trail too: when a
-- firm disputes their access level, this is the record of what we were told.
create table if not exists public.billing_events (
  event_id     text primary key,
  event_type   text not null,
  occurred_at  timestamptz not null,
  firm_id      uuid references public.firms(id) on delete set null,
  payload      jsonb not null default '{}'::jsonb,
  applied      boolean not null default false,
  skip_reason  text,
  received_at  timestamptz not null default now()
);

create index if not exists billing_events_firm_idx
  on public.billing_events (firm_id, occurred_at desc);

-- When the firm's billing state was last changed, measured by the EVENT's
-- clock rather than ours. An event older than this is stale and gets recorded
-- but not applied.
alter table public.firms
  add column if not exists billing_updated_at timestamptz;

alter table public.billing_events enable row level security;
