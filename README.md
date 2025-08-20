# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Supabase RLS Policies for Profiles

Run the following SQL in your Supabase SQL Editor to ensure users can view and update their own profiles. This is required for the profile page and payment details functionality to work correctly.

```sql
-- This script ensures users can select and update their own profile information.
-- It is safe to run this multiple times.

-- 1. Enable Row-Level Security on the profiles table if it's not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop all potentially conflicting old policies to start fresh.
-- Using "IF EXISTS" prevents errors if the policies don't exist.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles; -- A common default one.

-- 3. Create a policy to allow users to VIEW (select) their own profile.
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 4. Create a policy to allow users to UPDATE their own profile.
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Create a policy to allow new users to create their own profile entry.
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```
