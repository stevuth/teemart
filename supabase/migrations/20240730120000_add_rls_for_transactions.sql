
-- First, ensure that RLS is enabled on the transactions table.
-- This command is idempotent, so it's safe to run even if it's already enabled.
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to ensure a clean slate.
DROP POLICY IF EXISTS "Allow users to insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow users to view their own transactions" ON public.transactions;


-- Create a policy that allows an authenticated user to insert a transaction
-- record only if they are the buyer. This is a critical security check.
CREATE POLICY "Allow users to insert their own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (buyer_id = auth.uid());


-- Create a policy that allows a user to view a transaction if they are
-- either the buyer or the seller. This is necessary for the "My Purchases"
-- and "My Sales" sections of the profile page to work correctly.
CREATE POLICY "Allow users to view their own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (buyer_id = auth.uid() OR seller_id = auth.uid());
