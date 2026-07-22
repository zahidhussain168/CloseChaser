-- "Coming soon" integrations let a firm register interest so we can measure
-- demand and email them when an integration ships. One row per firm+integration.

create table if not exists public.integration_requests (
  id              uuid primary key default gen_random_uuid(),
  firm_id         uuid not null references public.firms (id) on delete cascade,
  integration_key text not null,
  created_at      timestamptz not null default now(),
  unique (firm_id, integration_key)
);
create index if not exists integration_requests_firm_idx
  on public.integration_requests (firm_id);

alter table public.integration_requests enable row level security;

drop policy if exists integration_requests_owner_all on public.integration_requests;
create policy integration_requests_owner_all on public.integration_requests
  for all using (
    exists (select 1 from public.firms f where f.id = integration_requests.firm_id and f.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.firms f where f.id = integration_requests.firm_id and f.owner_id = auth.uid())
  );
