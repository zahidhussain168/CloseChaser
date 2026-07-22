-- Private, firm-only notes on a client (e.g. "always slow, call don't email").
-- Never shown to the client; RLS already scopes clients to the owning firm.
alter table public.clients add column if not exists notes text;
