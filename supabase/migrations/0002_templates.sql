-- RuledOff — recurring request templates
-- A firm defines named templates (e.g. "Monthly close basics") holding standard
-- request items. A client can be assigned a default template, whose items are
-- auto-seeded into each new month's close. Templates can also be applied on demand.

create table if not exists public.request_templates (
  id         uuid primary key default gen_random_uuid(),
  firm_id    uuid not null references public.firms (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
create index if not exists request_templates_firm_idx on public.request_templates (firm_id);

create table if not exists public.template_items (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.request_templates (id) on delete cascade,
  type        text not null default 'document' check (type in ('transaction', 'document')),
  title       text not null,
  note        text,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists template_items_template_idx on public.template_items (template_id);

-- A client can auto-apply one template every month.
alter table public.clients
  add column if not exists default_template_id uuid
    references public.request_templates (id) on delete set null;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.request_templates enable row level security;
alter table public.template_items    enable row level security;

drop policy if exists request_templates_owner_all on public.request_templates;
create policy request_templates_owner_all on public.request_templates
  for all using (
    exists (select 1 from public.firms f where f.id = request_templates.firm_id and f.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.firms f where f.id = request_templates.firm_id and f.owner_id = auth.uid())
  );

drop policy if exists template_items_owner_all on public.template_items;
create policy template_items_owner_all on public.template_items
  for all using (
    exists (
      select 1 from public.request_templates t
      join public.firms f on f.id = t.firm_id
      where t.id = template_items.template_id and f.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.request_templates t
      join public.firms f on f.id = t.firm_id
      where t.id = template_items.template_id and f.owner_id = auth.uid()
    )
  );
