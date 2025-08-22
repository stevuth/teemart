# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Supabase Setup

To ensure the application functions correctly, you must run the following SQL script in your Supabase project's SQL Editor. This script sets up the necessary Row-Level Security (RLS) policies for the `profiles` table, which is crucial for features like updating payment details.

```sql
-- This script provides the final, correct RLS policies for the profiles table.

-- 1. Enable Row-Level Security on the profiles table if not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop all potentially conflicting old policies to start fresh.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update banking details" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert banking details" ON public.profiles;


-- 3. POLICY: Allow public read-access to non-sensitive profile data.
-- This allows anyone to see seller names, avatars, etc.
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

-- 4. POLICY: Allow users to view their OWN complete profile.
-- This is the crucial policy that was missing. It allows a user to read the row
-- they are about to update, which is required by the UPDATE policy's USING clause.
CREATE POLICY "Users can view their own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 5. POLICY: Allow new users to create their own profile entry.
-- This is required on user sign-up.
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. POLICY: Allow users to update their own profile.
-- This is the secure policy for updating payment details and other info.
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```
