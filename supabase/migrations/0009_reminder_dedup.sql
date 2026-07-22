-- Prevent double-sends: at most one reminder per close period per calendar day.
-- A plain `day` column (set by the app to the UTC date on insert) keeps the
-- index expression immutable. The scheduler claims the day's slot before
-- sending, so an overlapping run loses the unique race and skips instead of
-- emailing twice. This also bounds the weekly (level 4) cadence to one per day.
alter table public.reminders add column if not exists day date;

create unique index if not exists reminders_one_per_day_idx
  on public.reminders (close_period_id, day)
  where day is not null;
