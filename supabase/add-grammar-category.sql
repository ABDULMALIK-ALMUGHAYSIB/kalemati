alter table public.vocabulary_words
drop constraint if exists vocabulary_words_category_check;

alter table public.vocabulary_words
add constraint vocabulary_words_category_check
check (category in ('Work', 'Daily', 'Email', 'Interview', 'Grammar', 'Other'));
