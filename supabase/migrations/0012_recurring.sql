-- Recurring monthly requests: when auto_chase is on and the client has a default
-- template, the daily cron generates each new month's close from that template
-- and starts the chase automatically, so the standard pack goes out every month
-- without the bookkeeper lifting a finger.
alter table public.clients add column if not exists auto_chase boolean not null default false;
