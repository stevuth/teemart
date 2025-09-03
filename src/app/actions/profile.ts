
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import axios from 'axios';

type FormState = {
    message: string;
    error: boolean;
    account_name?: string;
} | null;

const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_dc2996e32f46e3b88e8e636b2122cba9914cac4d";

async function createTransferRecipient(accountNumber: string, bankCode: string, name: string) {
     if (!PAYSTACK_SECRET_KEY) {
        throw new Error('Paystack secret key is not configured on the server.');
    }
    
    try {
        const response = await axios.post(`${PAYSTACK_API_URL}/transferrecipient`, {
            type: "nuban",
            name, // The user's own name
            account_number: accountNumber,
            bank_code: bankCode,
            currency: "NGN"
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            }
        });
        
        if (response.data.status) {
            return response.data.data; // Returns recipient details including account_name
        } else {
            throw new Error(response.data.message || 'Failed to create Paystack transfer recipient.');
        }

    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred with Paystack.';
        throw new Error(errorMessage);
    }
}


export async function updatePaymentDetailsAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.user_metadata.full_name) {
        return { message: "You must be logged in and have a full name to perform this action.", error: true };
    }

    const accountNumber = formData.get('accountNumber') as string;
    const bankCode = formData.get('bankCode') as string;
    const userName = user.user_metadata.full_name;

    if (!accountNumber || !bankCode) {
        return { message: "Account number and bank code are required.", error: true };
    }
    
    try {
        const recipientData = await createTransferRecipient(accountNumber, bankCode, userName);
        
        const { account_name, recipient_code, details } = recipientData;

        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
                bank_name: details.bank_name,
                account_name: account_name,
                account_number: accountNumber,
                bank_code: bankCode,
                recipient_code: recipient_code,
            })
            .eq('id', user.id);

        if (profileUpdateError) {
             throw new Error(`Database update failed: ${profileUpdateError.message}`);
        }

        return { 
            message: `Your payment details have been successfully saved.`, 
            error: false,
            account_name: account_name
        };

    } catch (error: any) {
        return { message: error.message, error: true };
    }
}
