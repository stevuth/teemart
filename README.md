# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Supabase RLS Policies for Profiles

If you are having trouble updating user data (e.g., saving payment details), you may need to update the Row-Level Security (RLS) policies for the `profiles` table.

Run the following SQL script in your Supabase SQL Editor to apply the correct permissions. This script is idempotent, meaning it is safe to run multiple times.

```sql
-- This script provides the definitive RLS policies for the profiles table.

-- 1. Enable Row-Level Security on the profiles table if not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies on the table to avoid conflicts.
-- Using "IF EXISTS" prevents errors if a policy doesn't exist.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;

-- 3. Create a policy to allow public read access to profiles.
-- This is necessary for displaying public seller information.
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

-- 4. Create a policy to allow users to insert their own profile.
-- This is triggered on user sign-up.
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. Create a policy to allow users to update their own profile.
-- This is required for saving payment details or updating profile info.
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

```
