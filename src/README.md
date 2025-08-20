
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Supabase RLS Policies for Profiles

Run the following SQL in your Supabase SQL Editor to ensure users can view and update their own profiles. This is required for the profile page and payment details functionality to work correctly.

```sql
-- This script provides the definitive RLS policies for the profiles table.
-- It is safe to run this multiple times.

-- 1. Enable Row-Level Security on the profiles table if it's not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop all potentially conflicting old policies to start fresh.
-- This uses "IF EXISTS" to prevent errors if a policy doesn't exist.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;

-- 3. Create a policy to allow users to VIEW (select) their own profile.
-- This is the most important policy for fixing the "could not load" errors.
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 4. Create a policy to allow users to UPDATE their own profile.
-- This is required for saving verification status and payment details.
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Create a policy to allow new users to create their own profile entry.
-- This is handled by a database trigger but is best practice to include.
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 6. Create a policy to allow public read access to profiles.
-- This is necessary so the app can show the name and avatar of users who write reviews.
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);
```
