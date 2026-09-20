-- Stores AI-generated stories per user, one per batch of 10 words.
-- Already applied directly to production; kept here for schema history.

create table if not exists public.word_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_index integer not null,
  words jsonb not null,
  story text not null,
  story_arabic text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, batch_index)
);

create index if not exists word_stories_user_idx
  on public.word_stories (user_id, batch_index);

alter table public.word_stories enable row level security;

drop policy if exists "Users can read their own stories" on public.word_stories;
create policy "Users can read their own stories"
on public.word_stories
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own stories" on public.word_stories;
create policy "Users can insert their own stories"
on public.word_stories
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own stories" on public.word_stories;
create policy "Users can update their own stories"
on public.word_stories
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
