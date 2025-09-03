-- This function is a secure way to create a Paystack transfer recipient.
-- It is designed to be called from the client-side via Supabase's RPC.
-- It keeps the Paystack secret key secure on the server.

-- Make sure to set the Paystack secret key in the Supabase Vault:
-- 1. Go to your Supabase Project -> Settings -> Vault.
-- 2. Click "+ New Secret".
-- 3. Name: PAYSTACK_SECRET_KEY
-- 4. Value: Your Paystack secret key (e.g., sk_test_xxxxxxxx)

CREATE OR REPLACE FUNCTION public.create_paystack_recipient(
    account_number TEXT,
    bank_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This is crucial to run the function with elevated privileges
AS $$
DECLARE
    -- Paystack API details
    paystack_api_url TEXT := 'https://api.paystack.co';
    -- Retrieve the secret key from Supabase Vault
    paystack_secret_key TEXT := extensions.vault_get_secret('PAYSTACK_SECRET_KEY');

    -- Variables to hold data from Paystack
    resolved_account_name TEXT;
    resolved_bank_name TEXT;
    recipient_code TEXT;
    
    -- Other variables
    user_id UUID := auth.uid();
    response_data JSONB;
    error_message TEXT;
BEGIN
    -- Ensure the user is authenticated
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Step 1: Resolve bank account to get the account name
    -- This verifies the account details before creating a recipient.
    SELECT
        content::JSONB
    INTO
        response_data
    FROM
        extensions.http_get(
            paystack_api_url || '/bank/resolve?account_number=' || account_number || '&bank_code=' || bank_code,
            '',
            '{}',
            'application/json',
            '{"Authorization": "Bearer ' || paystack_secret_key || '"}'
        );
        
    -- Check if the resolve request was successful
    IF NOT (response_data->>'status')::BOOLEAN THEN
        error_message := 'Paystack error: ' || (response_data->>'message');
        RAISE EXCEPTION USING message = error_message;
    END IF;
    
    -- Extract account name and bank name from the response
    resolved_account_name := response_data->'data'->>'account_name';
    resolved_bank_name := response_data->'data'->>'bank_name';
    
    -- Step 2: Create the Transfer Recipient with the resolved details
    SELECT
        content::JSONB
    INTO
        response_data
    FROM
        extensions.http_post(
            paystack_api_url || '/transferrecipient',
            json_build_object(
                'type', 'nuban',
                'name', resolved_account_name,
                'account_number', account_number,
                'bank_code', bank_code,
                'currency', 'NGN'
            )::TEXT,
            'application/json',
            '{"Authorization": "Bearer ' || paystack_secret_key || '"}'
        );

    -- Check if the recipient creation was successful
    IF NOT (response_data->>'status')::BOOLEAN THEN
        error_message := 'Paystack error: ' || (response_data->>'message');
        RAISE EXCEPTION USING message = error_message;
    END IF;

    -- Extract the recipient code
    recipient_code := response_data->'data'->>'recipient_code';

    -- Step 3: Update the user's profile with all the new details
    UPDATE public.profiles
    SET
        bank_name = resolved_bank_name,
        account_name = resolved_account_name,
        account_number = account_number,
        bank_code = bank_code,
        recipient_code = recipient_code
    WHERE
        id = user_id;

    -- Return a success message with the details
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Payment details saved successfully for ' || resolved_account_name,
        'account_name', resolved_account_name
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_paystack_recipient(TEXT, TEXT) TO authenticated;
