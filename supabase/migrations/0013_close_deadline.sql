-- Deadline-aware escalation: an optional hard close day-of-month per client
-- ("books close the 5th"). The reminder system uses it to escalate channel as
-- the date approaches. Null means no deadline (behaviour unchanged).
alter table clients
  add column if not exists close_day smallint
  check (close_day is null or (close_day >= 1 and close_day <= 28));
