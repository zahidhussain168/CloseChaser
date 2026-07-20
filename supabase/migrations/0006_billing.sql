-- Phase 3: Paddle billing.
--
-- One subscription per firm. Paddle is the Merchant of Record, so RuledOff only
-- stores the ids and the current status; Paddle owns the card data and tax.
-- Every firm starts on a 14-day trial from signup.

alter table public.firms
  add column if not exists paddle_customer_id text,
  add column if not exists paddle_subscription_id text,
  add column if not exists subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing','active','past_due','paused','canceled','expired')),
  add column if not exists current_period_end timestamptz,
  add column if not exists trial_ends_at timestamptz;

-- Existing firms: trial runs 14 days from when they signed up.
update public.firms
  set trial_ends_at = created_at + interval '14 days'
  where trial_ends_at is null;

-- New firms default their trial to 14 days from creation. A column default
-- cannot reference created_at, so a trigger sets it on insert.
create or replace function public.set_trial_ends_at()
returns trigger language plpgsql as $$
begin
  if new.trial_ends_at is null then
    new.trial_ends_at := coalesce(new.created_at, now()) + interval '14 days';
  end if;
  return new;
end;
$$;

drop trigger if exists firms_set_trial on public.firms;
create trigger firms_set_trial
  before insert on public.firms
  for each row execute function public.set_trial_ends_at();
