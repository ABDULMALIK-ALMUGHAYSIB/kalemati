-- Adds spaced-repetition scheduling to vocabulary_words.
-- Run once in the Supabase SQL editor.

alter table public.vocabulary_words
  add column if not exists review_level integer not null default 0
    check (review_level between 0 and 4),
  add column if not exists next_review_at timestamptz not null default now(),
  add column if not exists last_reviewed_at timestamptz;

create index if not exists vocabulary_words_next_review_idx
  on public.vocabulary_words (user_id, next_review_at);
