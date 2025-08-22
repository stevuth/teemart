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
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- 3. Allow users to view their own profile.
-- This is crucial for allowing updates, as the user must be able to read the row they intend to modify.
CREATE POLICY "Users can view their own profile." ON public.profiles
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- 4. Allow public read access for general profile viewing (e.g., seller pages).
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
FOR SELECT 
USING (true);

-- 5. Allow new authenticated users to insert their own profile.
CREATE POLICY "Users can insert their own profile." ON public.profiles
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- 6. Allow authenticated users to update their own profile.
CREATE POLICY "Users can update their own profile." ON public.profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```
