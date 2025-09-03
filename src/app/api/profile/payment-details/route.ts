
import { NextResponse } from 'next/server';
import axios from 'axios';
import { createSupabaseServerClient } from '@/utils/supabase/server';

const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_dc2996e32f46e3b88e8e636b2122cba9914cac4d";

/**
 * This API route securely resolves a bank account using the Paystack API.
 * It acts as a proxy to avoid exposing the secret key on the client.
 */
export async function POST(request: Request) {
    const supabase = createSupabaseServerClient();
    
    // 1. Check for an authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return new NextResponse(
            JSON.stringify({ error: 'Authentication failed: You must be logged in.' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    // 2. Get account details from the request body
    const { accountNumber, bankCode } = await request.json();
    if (!accountNumber || !bankCode) {
        return new NextResponse(
            JSON.stringify({ error: 'Account number and bank code are required.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // 3. Call Paystack's bank resolve endpoint
    try {
        const response = await axios.get(`${PAYSTACK_API_URL}/bank/resolve`, {
            params: {
                account_number: accountNumber,
                bank_code: bankCode
            },
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
            }
        });

        if (response.data.status) {
            // On success, return the verified data
            return NextResponse.json({
                success: true,
                account_name: response.data.data.account_name,
                account_number: response.data.data.account_number,
            });
        } else {
            // If Paystack returns a non-error but status is false
            return new NextResponse(
                JSON.stringify({ error: response.data.message || 'Could not verify account details.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
    } catch (error: any) {
        // Handle network errors or errors from Paystack's API
        console.error("Error resolving bank account:", error.response?.data || error.message);
        return new NextResponse(
            JSON.stringify({ error: error.response?.data?.message || 'An unexpected error occurred.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
