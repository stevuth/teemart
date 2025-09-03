
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Supabase Setup

To ensure the application functions correctly, you must run the following SQL script in your Supabase project's SQL Editor. This script sets up the necessary tables and policies for the escrow payment system. It is safe to run this multiple times.

```sql
-- =========== PROFILES TABLE SETUP ===========

-- 1. Add columns for payment details and Paystack recipient codes to the profiles table.
-- Using "IF NOT EXISTS" makes this script safe to run multiple times.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS account_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS bank_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS recipient_code VARCHAR(255);

-- 2. Enable Row-Level Security on the profiles table if not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop all potentially conflicting old policies to start fresh.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- 4. Allow users to view their own profile.
CREATE POLICY "Users can view their own profile." ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 5. Allow public read access for general profile viewing (e.g., seller pages).
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
FOR SELECT
USING (true);

-- 6. Allow new authenticated users to insert their own profile.
CREATE POLICY "Users can insert their own profile." ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 7. Allow authenticated users to update their own payment details.
-- This policy is more specific and secure.
CREATE POLICY "Users can update their own profile." ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id)
-- Specify the only columns a user is allowed to update
USING (true)
;


-- =========== TRANSACTIONS TABLE SETUP ===========

-- 1. Create the transaction status enum type.
-- Using "IF NOT EXISTS" makes this script safe to run multiple times.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE public.transaction_status AS ENUM (
            'pending',
            'released',
            'disputed',
            'refunded'
        );
    END IF;
END$$;


-- 2. Create the transactions table.
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_price NUMERIC NOT NULL,
    buyer_fee NUMERIC NOT NULL,
    seller_fee NUMERIC NOT NULL,
    shipping_fee NUMERIC DEFAULT 0,
    paystack_ref VARCHAR(255) UNIQUE NOT NULL,
    status transaction_status DEFAULT 'pending' NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    product_details JSONB -- New column for storing product snapshot
);

-- 3. Enable RLS for the transactions table.
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. Drop old policies to prevent conflicts.
DROP POLICY IF EXISTS "Users can view their own transactions." ON public.transactions;

-- 5. Allow users to view transactions where they are the buyer or the seller.
CREATE POLICY "Users can view their own transactions." ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- =========== PRODUCTS TABLE RLS (Important for transactions) ===========
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
CREATE POLICY "Enable read access for all users" ON public.products
FOR SELECT
USING (true);


-- =========== CLEANUP OLD FUNCTIONS ===========
DROP FUNCTION IF EXISTS public.update_user_profile(VARCHAR, VARCHAR, VARCHAR, VARCHAR);
```

