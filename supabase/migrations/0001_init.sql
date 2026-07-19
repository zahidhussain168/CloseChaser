-- RuledOff — Phase 1 schema
-- "The Ledger": firms → clients → close_periods → items, plus magic_links,
-- reminders, and per-firm editable email_templates.
--
-- Security model:
--  * The bookkeeper app uses the ANON/publishable key with a Supabase session;
--    RLS below scopes every row to the firm the signed-in user owns.
--  * Public magic-link routes and the cron scheduler use the SECRET key
--    (service role), which bypasses RLS and is scoped in application code by
--    the link token. So there are intentionally NO public/anon policies for
--    the client-facing paths.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.firms (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null unique references auth.users (id) on delete cascade,
  name         text not null,
  accent_color text not null default '#A88B4C',
  reply_to     text,
  logo_url     text,
  created_at   timestamptz not null default now()
);

create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  firm_id      uuid not null references public.firms (id) on delete cascade,
  name         text not null,
  email        text not null,
  phone        text,
  qbo_realm_id text,                         -- null = manual-only client
  created_at   timestamptz not null default now()
);
create index if not exists clients_firm_idx on public.clients (firm_id);

create table if not exists public.close_periods (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients (id) on delete cascade,
  month            date not null,            -- 'YYYY-MM-01'
  status           text not null default 'open'
                     check (status in ('open', 'chasing', 'closed')),
  chase_started_at timestamptz,
  created_at       timestamptz not null default now(),
  unique (client_id, month)
);
create index if not exists close_periods_client_idx on public.close_periods (client_id);

create table if not exists public.items (
  id              uuid primary key default gen_random_uuid(),
  close_period_id uuid not null references public.close_periods (id) on delete cascade,
  type            text not null check (type in ('transaction', 'document')),
  source          text not null default 'manual' check (source in ('qbo', 'manual')),
  qbo_txn_id      text,
  title           text not null,
  details         jsonb not null default '{}'::jsonb,
  state           text not null default 'requested'
                    check (state in ('requested', 'nudged', 'answered', 'accepted')),
  answer_text     text,
  attachments     jsonb not null default '[]'::jsonb,
  answered_at     timestamptz,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists items_period_idx on public.items (close_period_id);
create index if not exists items_state_idx on public.items (state);

create table if not exists public.magic_links (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  token          text not null unique,
  expires_at     timestamptz not null,
  last_opened_at timestamptz,
  revoked_at     timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists magic_links_token_idx on public.magic_links (token);
create index if not exists magic_links_client_idx on public.magic_links (client_id);

create table if not exists public.reminders (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients (id) on delete cascade,
  close_period_id uuid not null references public.close_periods (id) on delete cascade,
  level           int not null check (level between 1 and 4),
  channel         text not null default 'email' check (channel in ('email', 'manual_text')),
  scheduled_for   timestamptz not null default now(),
  sent_at         timestamptz,
  stopped_reason  text,
  created_at      timestamptz not null default now()
);
create index if not exists reminders_period_idx on public.reminders (close_period_id);

create table if not exists public.email_templates (
  id         uuid primary key default gen_random_uuid(),
  firm_id    uuid not null references public.firms (id) on delete cascade,
  kind       text not null check (kind in ('initial','level1','level2','level3','level4')),
  subject    text not null,
  body       text not null,
  updated_at timestamptz not null default now(),
  unique (firm_id, kind)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.firms           enable row level security;
alter table public.clients         enable row level security;
alter table public.close_periods   enable row level security;
alter table public.items           enable row level security;
alter table public.magic_links     enable row level security;
alter table public.reminders       enable row level security;
alter table public.email_templates enable row level security;

-- firms: a user owns exactly their own firm row
drop policy if exists firms_owner_all on public.firms;
create policy firms_owner_all on public.firms
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- clients: scoped to the owner's firm
drop policy if exists clients_owner_all on public.clients;
create policy clients_owner_all on public.clients
  for all using (
    exists (select 1 from public.firms f where f.id = clients.firm_id and f.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.firms f where f.id = clients.firm_id and f.owner_id = auth.uid())
  );

-- close_periods: via client → firm
drop policy if exists close_periods_owner_all on public.close_periods;
create policy close_periods_owner_all on public.close_periods
  for all using (
    exists (
      select 1 from public.clients c
      join public.firms f on f.id = c.firm_id
      where c.id = close_periods.client_id and f.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.clients c
      join public.firms f on f.id = c.firm_id
      where c.id = close_periods.client_id and f.owner_id = auth.uid()
    )
  );

-- items: via close_period → client → firm
drop policy if exists items_owner_all on public.items;
create policy items_owner_all on public.items
  for all using (
    exists (
      select 1 from public.close_periods cp
      join public.clients c on c.id = cp.client_id
      join public.firms f on f.id = c.firm_id
      where cp.id = items.close_period_id and f.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.close_periods cp
      join public.clients c on c.id = cp.client_id
      join public.firms f on f.id = c.firm_id
      where cp.id = items.close_period_id and f.owner_id = auth.uid()
    )
  );

-- magic_links: firm owner can read/manage; clients never use RLS (secret key)
drop policy if exists magic_links_owner_all on public.magic_links;
create policy magic_links_owner_all on public.magic_links
  for all using (
    exists (
      select 1 from public.clients c
      join public.firms f on f.id = c.firm_id
      where c.id = magic_links.client_id and f.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.clients c
      join public.firms f on f.id = c.firm_id
      where c.id = magic_links.client_id and f.owner_id = auth.uid()
    )
  );

-- reminders: firm owner can read; cron writes via secret key
drop policy if exists reminders_owner_all on public.reminders;
create policy reminders_owner_all on public.reminders
  for all using (
    exists (
      select 1 from public.clients c
      join public.firms f on f.id = c.firm_id
      where c.id = reminders.client_id and f.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.clients c
      join public.firms f on f.id = c.firm_id
      where c.id = reminders.client_id and f.owner_id = auth.uid()
    )
  );

-- email_templates: firm owner
drop policy if exists email_templates_owner_all on public.email_templates;
create policy email_templates_owner_all on public.email_templates
  for all using (
    exists (select 1 from public.firms f where f.id = email_templates.firm_id and f.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.firms f where f.id = email_templates.firm_id and f.owner_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Private storage bucket for client uploads (receipts, statements, W-9s).
-- No storage policies → only the secret key (server) can read/write; the
-- bookkeeper and client both go through server routes that issue signed URLs.
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;
