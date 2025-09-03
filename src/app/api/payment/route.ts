
"use server";

import { NextResponse } from 'next/server';
import axios from 'axios';
import { createSupabaseServerClient } from '@/utils/supabase/server';

const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_dc2996e32f46e3b88e8e636b2122cba9914cac4d";

async function createTransferRecipient(name: string, accountNumber: string, bankCode: string) {
    if (!PAYSTACK_SECRET_KEY) throw new Error('Paystack secret key is not configured.');

    const response = await axios.post(
        `${PAYSTACK_API_URL}/transferrecipient`,
        {
            type: "nuban",
            name,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: "NGN"
        },
        {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            }
        }
    );

    if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to create transfer recipient with Paystack.');
    }
    
    const recipientData = response.data.data;
    const accountName = recipientData.details.account_name;
    const recipientCode = recipientData.recipient_code;
    
    return { account_name: accountName, recipient_code: recipientCode };
}


export async function POST(request: Request) {
    const supabase = createSupabaseServerClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse(
                JSON.stringify({ error: 'Authentication failed: You must be logged in.' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const body = await request.json();
        const { accountNumber, bankCode } = body;

        if (!accountNumber || !bankCode) {
            return new NextResponse(
                JSON.stringify({ error: 'Account number and bank code are required.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            throw new Error('Could not retrieve user profile to get full name.');
        }

        const { account_name, recipient_code } = await createTransferRecipient(
            profile.full_name,
            accountNumber,
            bankCode
        );
        
        return NextResponse.json({ account_name, recipient_code });

    } catch (error: any) {
        console.error("Error in POST /api/payment:", error);
        const errorMessage = error.response?.data?.message || error.message || 'An internal server error occurred.';
        const statusCode = error.response?.status || 500;
        
        return new NextResponse(
            JSON.stringify({ error: errorMessage }),
            { status: statusCode, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
