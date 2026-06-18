# Kalemati Supabase Setup

Follow these steps once for each Supabase project.

## 1. Create the project

1. Create a new project in Supabase.
2. Open **Project Settings > API**.
3. Copy the project URL and anon public key.

## 2. Configure environment variables

Add these values to `.env`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

The anon key is safe to use in the frontend when Row Level Security is enabled.
Do not place service role keys in the frontend.

## 3. Create the database table and policies

Open **SQL Editor** in Supabase and run:

```sql
-- See supabase/schema.sql
```

The SQL file creates `public.vocabulary_words`, enables Row Level Security, and
adds policies so each authenticated user can only read and modify their own
words.

## 4. Enable email authentication

Open **Authentication > Providers** and make sure Email is enabled.

If email confirmations are enabled, a new user may need to confirm their email
before their first login session.

## 5. Restart the app

After editing `.env`, restart the Vite dev server:

```bash
npm run dev
```

When a user signs in for the first time, Kalemati migrates any old localStorage
words to Supabase once for that user.
