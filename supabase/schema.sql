create extension if not exists "pgcrypto";

create table if not exists public.vocabulary_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  english text not null,
  arabic_translation text not null,
  simple_meaning text default '',
  example_sentence text default '',
  when_to_use text default '',
  category text not null default 'Other'
    check (category in ('Work', 'Daily', 'Email', 'Interview', 'Grammar', 'Other')),
  status text not null default 'New'
    check (status in ('New', 'Learning', 'Mastered')),
  date_added timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vocabulary_words_user_date_idx
  on public.vocabulary_words (user_id, date_added desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_vocabulary_words_updated_at on public.vocabulary_words;

create trigger set_vocabulary_words_updated_at
before update on public.vocabulary_words
for each row
execute function public.set_updated_at();

alter table public.vocabulary_words enable row level security;

drop policy if exists "Users can read their own words" on public.vocabulary_words;
create policy "Users can read their own words"
on public.vocabulary_words
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own words" on public.vocabulary_words;
create policy "Users can insert their own words"
on public.vocabulary_words
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own words" on public.vocabulary_words;
create policy "Users can update their own words"
on public.vocabulary_words
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own words" on public.vocabulary_words;
create policy "Users can delete their own words"
on public.vocabulary_words
for delete
to authenticated
using (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table public.vocabulary_words;
exception
  when duplicate_object then null;
end;
$$;
