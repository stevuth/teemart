
'use server';

import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
    console.error("FATAL: Paystack secret key is not set in environment variables.");
}

type Bank = {
    id: number;
    name: string;
    slug: string;
    code: string;
    longcode: string;
    gateway: string | null;
    pay_with_bank: boolean;
    active: boolean;
    is_deleted: boolean;
    country: string;
    currency: string;
    type: string;
    created_at: string;
    updated_at: string;
}

/**
 * Fetches the list of supported banks from Paystack.
 * @returns An object with either the list of banks or an error message.
 */
export async function getBankListAction(): Promise<{ success: boolean; data?: Bank[]; error?: string; }> {
    if (!PAYSTACK_SECRET_KEY) {
        return { success: false, error: 'Payment provider not configured.' };
    }
    try {
        // Construct the URL with query parameters manually for reliability
        const requestUrl = `${PAYSTACK_API_URL}/bank?country=nigeria&pay_with_bank=true&perPage=100`;
        
        const response = await axios.get(requestUrl, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });
        return { success: true, data: response.data.data };
    } catch (error: any) {
        console.error('Paystack Bank List Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'Failed to fetch bank list.' };
    }
}


type AccountResolutionResponse = {
    account_number: string;
    account_name: string;
    bank_id: number;
}
/**
 * Resolves an account number to get the account holder's name.
 * @param accountNumber - The 10-digit bank account number.
 * @param bankCode - The Paystack code for the bank.
 * @returns An object with either the account details or an error message.
 */
export async function resolveAccountNumberAction(accountNumber: string, bankCode: string): Promise<{ success: boolean; data?: AccountResolutionResponse; error?: string; }> {
     if (!PAYSTACK_SECRET_KEY) {
        return { success: false, error: 'Payment provider not configured.' };
    }
    try {
        const response = await axios.get(`${PAYSTACK_API_URL}/bank/resolve`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
            params: {
                account_number: accountNumber,
                bank_code: bankCode,
            }
        });
        return { success: true, data: response.data.data };
    } catch (error: any) {
        console.error('Paystack Account Resolution Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'Could not verify account name.' };
    }
}
