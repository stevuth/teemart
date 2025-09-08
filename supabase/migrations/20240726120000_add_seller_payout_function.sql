
-- supabase/migrations/20240726120000_add_seller_payout_function.sql

-- Drop the function if it already exists to ensure a clean slate
DROP FUNCTION IF EXISTS get_seller_payout_details_for_buyer(uuid);

-- Define the composite type that the function will return
-- This helps in providing a clear and predictable structure for the response
CREATE TYPE public.seller_payout_details AS (
    account_name text,
    account_number text,
    bank_code text,
    recipient_code text
);

-- Create the security definer function
-- This function will run with the permissions of the user who created it (the owner),
-- which allows it to bypass row-level security (RLS) policies in a controlled manner.
CREATE OR REPLACE FUNCTION public.get_seller_payout_details_for_buyer(p_transaction_id uuid)
RETURNS public.seller_payout_details
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Important to specify the schema context
AS $$
DECLARE
    v_transaction_record record;
    v_seller_profile record;
    v_payout_details public.seller_payout_details;
BEGIN
    -- 1. Security Check: Ensure the person calling this function is the buyer of the transaction.
    -- We use `auth.uid()` to get the ID of the currently authenticated user making the request.
    SELECT * INTO v_transaction_record
    FROM public.transactions
    WHERE id = p_transaction_id AND buyer_id = auth.uid();

    -- If no record is found, it means the caller is not the buyer, so raise an exception.
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permission denied: You are not the buyer for this transaction.';
    END IF;

    -- 2. Status Check: Ensure the transaction status is 'delivered'.
    -- Funds should only be released after the item has been marked as delivered.
    IF v_transaction_record.status <> 'delivered' THEN
        RAISE EXCEPTION 'Invalid transaction status. Payment can only be released for delivered items.';
    END IF;

    -- 3. Fetch Seller's Profile: If security checks pass, safely fetch the seller's bank details.
    SELECT
        account_name,
        account_number,
        bank_code,
        recipient_code
    INTO v_seller_profile
    FROM public.profiles
    WHERE id = v_transaction_record.seller_id;
    
    -- If the seller's profile is not found, raise an exception.
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Seller profile not found.';
    END IF;

    -- 4. Populate the return type and return the details.
    v_payout_details.account_name := v_seller_profile.account_name;
    v_payout_details.account_number := v_seller_profile.account_number;
    v_payout_details.bank_code := v_seller_profile.bank_code;
    v_payout_details.recipient_code := v_seller_profile.recipient_code;

    RETURN v_payout_details;
END;
$$;

-- Grant execute permission on this function to authenticated users.
-- This allows logged-in users to call the function, but the internal security checks
-- within the function will determine if they are allowed to get the data.
GRANT EXECUTE ON FUNCTION public.get_seller_payout_details_for_buyer(uuid) TO authenticated;
