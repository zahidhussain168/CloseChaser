-- Move the default firm accent from the old brass to the editorial gold, so a
-- newly created firm matches the rest of the design system out of the box.
-- 0001_init.sql is left as-is: it records what was actually applied.

alter table firms alter column accent_color set default '#C59B3A';

-- Bring any firm still carrying the old default along with it. Firms that have
-- deliberately chosen their own colour are untouched.
update firms set accent_color = '#C59B3A' where accent_color = '#A88B4C';
