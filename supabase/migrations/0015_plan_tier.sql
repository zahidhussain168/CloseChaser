-- Two flat paid tiers: 'pro' (the core close-and-chase product) and 'scale'
-- (adds the intelligence + automation: Close Forecast, AI analyst, SMS
-- escalation, responsiveness scoring, Close Receipts). Set by the Paddle webhook
-- from the purchased price. Null while trialing (trial gets full Scale access)
-- or when there is no active subscription. Never per-client: still flat.
alter table firms
  add column if not exists plan text
  check (plan is null or plan in ('pro', 'scale'));
