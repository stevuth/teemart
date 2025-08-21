
'use server';

import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
    console.error("Paystack secret key is not set in environment variables.");
}

/**
 * Fetches the list of banks from Paystack.
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getBankList() {
    if (!PAYSTACK_SECRET_KEY) {
        return { success: false, error: 'Server configuration error: Paystack key not found.' };
    }
    try {
        const response = await axios.get(`${PAYSTICK_API_URL}/bank`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
            }
        });
        if (response.data.status) {
            // Remove duplicates from the bank list based on the 'code' field
            const uniqueBanks = Array.from(new Map(response.data.data.map((bank: any) => [bank.code, bank])).values());
            return { success: true, data: uniqueBanks as any[] };
        }
        return { success: false, error: response.data.message };
    } catch (error: any) {
        console.error("Error fetching bank list:", error.response?.data || error.message);
        return { success: false, error: 'Could not retrieve bank list from Paystack.' };
    }
}

/**
 * Resolves a bank account number to get the account name.
 * @param {string} accountNumber - The 10-digit account number.
 * @param {string} bankCode - The bank code from Paystack.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function resolveBankAccount(accountNumber: string, bankCode: string) {
    if (!PAYSTACK_SECRET_KEY) {
        return { success: false, error: 'Server configuration error: Paystack key not found.' };
    }
     if (!accountNumber || !bankCode || accountNumber.length !== 10) {
        return { success: false, error: 'Invalid account number or bank code.' };
    }
    try {
        const response = await axios.get(`${PAYSTACK_API_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
             headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
            }
        });

        if (response.data.status) {
            return { success: true, data: response.data.data };
        }
        return { success: false, error: response.data.message || 'Could not verify account details.' };

    } catch (error: any) {
        console.error("Error resolving bank account:", error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'An error occurred during verification.' };
    }
}
