
-- This function securely retrieves a seller's bank details for a specific transaction.
-- It can only be successfully called by the authenticated user who is the buyer of that transaction,
-- and only when the transaction status is 'delivered'.
-- The SECURITY DEFINER clause allows it to bypass RLS policies for the read operation inside the function,
-- but the strict checks on auth.uid() and status ensure it cannot be misused.
CREATE OR REPLACE FUNCTION get_seller_payout_details_for_buyer(p_transaction_id uuid)
RETURNS TABLE (
    account_number text,
    account_name text,
    bank_code text,
    recipient_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_transaction_record transactions;
BEGIN
    -- Fetch the transaction and verify that the current user is the buyer
    SELECT * INTO v_transaction_record
    FROM transactions
    WHERE id = p_transaction_id AND buyer_id = auth.uid();

    -- If no transaction is found, or the caller is not the buyer, raise an exception.
    IF v_transaction_record.id IS NULL THEN
        RAISE EXCEPTION 'No permission or transaction not found';
    END IF;

    -- Additional security check: ensure the transaction is in the 'delivered' state.
    IF v_transaction_record.status <> 'delivered' THEN
        RAISE EXCEPTION 'Cannot fetch payout details. Order status is not "delivered".';
    END IF;

    -- If all checks pass, return the seller's bank details from the profiles table.
    RETURN QUERY
    SELECT
        p.account_number,
        p.account_name,
        p.bank_code,
        p.recipient_code
    FROM
        profiles p
    WHERE
        p.id = v_transaction_record.seller_id;
END;
$$;
