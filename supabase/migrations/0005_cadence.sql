-- Phase 3: per-firm reminder cadence.
--
-- The escalation ladder stays in the copy (friendly, specific, consequence,
-- weekly). What becomes configurable is only WHEN those go out, so a firm that
-- finds day 2 pushy can move to day 4 without changing the wording.

alter table public.firms
  add column if not exists reminder_offsets int[] not null default '{2,5,9}';

alter table public.firms
  add column if not exists reminder_weekly_step int not null default 7;

-- Guard rails: at least one milestone, sane spacing, and a weekly step that
-- cannot schedule reminders on top of each other.
alter table public.firms drop constraint if exists firms_reminder_offsets_sane;
alter table public.firms add constraint firms_reminder_offsets_sane
  check (
    array_length(reminder_offsets, 1) between 1 and 6
    and reminder_offsets[1] >= 1
  );

alter table public.firms drop constraint if exists firms_reminder_weekly_step_sane;
alter table public.firms add constraint firms_reminder_weekly_step_sane
  check (reminder_weekly_step between 3 and 30);
