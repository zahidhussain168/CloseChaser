-- Post-signup onboarding answers, stored on the firm. onboarded_at doubles as
-- the "has finished (or skipped) the welcome step" flag so it only shows once.
alter table public.firms add column if not exists accounting_software text;
alter table public.firms add column if not exists client_count text;
alter table public.firms add column if not exists chase_method text;
alter table public.firms add column if not exists referral_source text;
alter table public.firms add column if not exists onboarded_at timestamptz;
