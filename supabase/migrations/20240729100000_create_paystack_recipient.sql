
-- Enable HTTP extension
CREATE EXTENSION IF NOT EXISTS http;

-- Function to create a transfer recipient on Paystack
CREATE OR REPLACE FUNCTION create_paystack_recipient(
    account_name TEXT,
    account_number TEXT,
    bank_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    paystack_secret_key TEXT;
    response JSONB;
BEGIN
    -- It's more secure to get the key from a secret management service if available
    -- For simplicity here, we assume it's an environment variable accessible to Postgres
    -- In Supabase, you can set this up via the dashboard or other secure means.
    -- For this example, let's hardcode it for demonstration, but this is NOT recommended for production.
    paystack_secret_key := 'sk_test_dc2996e32f46e3b88e8e636b2122cba9914cac4d';

    SELECT content::JSONB INTO response
    FROM http_post(
        'https://api.paystack.co/transferrecipient',
        jsonb_build_object(
            'type', 'nuban',
            'name', account_name,
            'account_number', account_number,
            'bank_code', bank_code,
            'currency', 'NGN'
        ),
        'application/json',
        ARRAY[http_header('Authorization', 'Bearer ' || paystack_secret_key)]
    );

    IF (response->>'status')::BOOLEAN = TRUE THEN
        RETURN response->'data';
    ELSE
        RAISE EXCEPTION 'Paystack API Error: %', response->>'message';
    END IF;
END;
$$;


-- Grant usage on the function to authenticated users
GRANT EXECUTE ON FUNCTION create_paystack_recipient(TEXT, TEXT, TEXT) TO authenticated;
