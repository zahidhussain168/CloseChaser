-- A third item type: a questionnaire. One checklist item that asks the client
-- several short questions at once (like a tax organizer), answered on the same
-- no-login link. The questions live in details.questions (a string array); the
-- client's answers are compiled into answer_text.

alter table public.items drop constraint if exists items_type_check;
alter table public.items
  add constraint items_type_check
  check (type in ('transaction', 'document', 'questionnaire'));
