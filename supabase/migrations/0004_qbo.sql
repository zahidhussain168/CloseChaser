-- Phase 2: QuickBooks Online connection + sync bookkeeping.
--
-- One QBO company (realm) per firm connection. Tokens are encrypted in the
-- application layer (AES-256-GCM, see src/lib/crypto.ts) before they ever reach
-- this table, so a database dump alone does not yield working credentials.

create table if not exists public.qbo_connections (
  id                 uuid primary key default gen_random_uuid(),
  firm_id            uuid not null references public.firms (id) on delete cascade,
  realm_id           text not null,
  company_name       text,
  access_token       text not null,          -- encrypted
  refresh_token      text not null,          -- encrypted
  access_expires_at  timestamptz not null,
  refresh_expires_at timestamptz,
  last_synced_at     timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (firm_id, realm_id)
);
create index if not exists qbo_connections_firm_idx on public.qbo_connections (firm_id);

-- Track write-back state per item so a failed push to QBO is visible and
-- retryable rather than silently lost.
alter table public.items add column if not exists qbo_synced_at timestamptz;
alter table public.items add column if not exists qbo_sync_error text;

-- Where a transaction item came from, so a re-sync does not duplicate it.
create unique index if not exists items_qbo_txn_unique
  on public.items (close_period_id, qbo_txn_id)
  where qbo_txn_id is not null;

alter table public.qbo_connections enable row level security;

drop policy if exists qbo_connections_owner_all on public.qbo_connections;
create policy qbo_connections_owner_all on public.qbo_connections
  for all using (
    exists (select 1 from public.firms f where f.id = qbo_connections.firm_id and f.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.firms f where f.id = qbo_connections.firm_id and f.owner_id = auth.uid())
  );
