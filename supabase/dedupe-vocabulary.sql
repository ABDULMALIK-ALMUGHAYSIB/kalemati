-- Removes duplicated words per user while keeping the newest row.
-- Run this in Supabase SQL Editor if the same words were imported multiple times.

with ranked_words as (
  select
    id,
    row_number() over (
      partition by user_id, lower(trim(english))
      order by date_added desc, created_at desc, id desc
    ) as row_rank
  from public.vocabulary_words
)
delete from public.vocabulary_words
where id in (
  select id
  from ranked_words
  where row_rank > 1
);

-- Optional safety guard for the future:
-- This prevents the exact same normalized English word from being stored twice
-- for the same user.
create unique index if not exists vocabulary_words_user_english_unique_idx
  on public.vocabulary_words (user_id, lower(trim(english)));
