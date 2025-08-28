
'use server';

import axios from 'axios';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import type { CartItem } from '@/contexts/cart-context';

const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;


/**
 * Initializes a Paystack transaction.
 * @param email - The buyer's email.
 * @param amount - The total amount to be paid (in kobo).
 * @param metadata - Additional data to be stored with the transaction.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function initializeTransactionAction(email: string, amount: number, metadata: object) {
    if (!PAYSTACK_SECRET_KEY) {
        console.error("Paystack secret key is not set.");
        return { success: false, error: 'Server configuration error.' };
    }

    try {
        const response = await axios.post(`${PAYSTACK_API_URL}/transaction/initialize`, {
            email,
            amount: Math.round(amount * 100), // Convert to kobo
            metadata,
             callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/verify-payment`
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            }
        });

        if (response.data.status) {
            return { success: true, data: response.data.data };
        } else {
            return { success: false, error: response.data.message };
        }

    } catch (error: any) {
        console.error("Error initializing transaction:", error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'An unexpected error occurred.' };
    }
}


/**
 * Verifies a Paystack transaction and creates transaction records in Supabase.
 * @param reference - The transaction reference from Paystack.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function verifyTransactionAction(reference: string) {
    if (!PAYSTACK_SECRET_KEY) {
        console.error("Paystack secret key is not set.");
        return { success: false, error: 'Server configuration error.' };
    }
    const supabase = createSupabaseServerClient();
    
    try {
        const response = await axios.get(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
        });

        const { status, data } = response.data;
        if (status && data.status === 'success') {
            const { metadata } = data;
            const { cartItems, buyer_id, shipping_fee } = metadata;

            // Use a transaction to ensure all inserts succeed or none do.
            const transactionRecords = cartItems.map((item: CartItem & {image: string[]}) => {
                const productPrice = item.price * item.quantity;
                const buyerFee = productPrice * 0.03;
                const sellerFee = productPrice * 0.02;

                return {
                    buyer_id,
                    seller_id: item.user_id,
                    product_id: item.id,
                    product_price: productPrice,
                    buyer_fee: buyerFee,
                    seller_fee: sellerFee,
                    shipping_fee: item.deliveryFee || 0, // Use individual item delivery fee
                    paystack_ref: reference,
                    status: 'pending' as const,
                    product_details: {
                        name: item.name,
                        image: Array.isArray(item.image) ? item.image : [item.image],
                    }
                };
            });
            
            const { error } = await supabase.from('transactions').insert(transactionRecords);

            if (error) {
                console.error('Supabase insert error:', error);
                // In a real-world scenario, you might want to handle this more gracefully,
                // e.g., by queueing a retry or logging for manual intervention,
                // as the user has already paid.
                return { success: false, error: 'Failed to save transaction details. Please contact support.' };
            }
            
            return { success: true };
        } else {
            return { success: false, error: 'Payment verification failed.' };
        }

    } catch (error: any) {
        console.error("Error verifying transaction:", error.response?.data || error.message);
        return { success: false, error: 'An unexpected error occurred during verification.' };
    }
}


/**
 * Fetches the list of Nigerian banks from Paystack.
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getBankListAction() {
    if (!PAYSTACK_SECRET_KEY) {
        console.error("Paystack secret key is not set.");
        return { success: false, error: 'Server configuration error.' };
    }

    try {
        const response = await axios.get(`${PAYSTACK_API_URL}/bank?country=nigeria`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
            timeout: 10000
        });

        if (response.data.status) {
            const uniqueBanks = Array.from(new Map(response.data.data.map((bank: any) => [bank.code, bank])).values());
            return { success: true, data: uniqueBanks as any[] };
        } else {
            return { success: false, error: response.data.message };
        }

    } catch (error: any) {
        console.error("Error fetching bank list:", error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'An unexpected error occurred.' };
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
        console.error("Paystack secret key is not set.");
        return { success: false, error: 'Server configuration error.' };
    }
    if (!accountNumber || !bankCode || accountNumber.length !== 10) {
        return { success: false, error: 'Invalid account number or bank code.' };
    }
    try {
        const response = await axios.get(`${PAYSTACK_API_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
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


/**
 * Creates a Paystack Transfer Recipient for a seller and saves the recipient code.
 * @param name - The seller's account name.
 * @param accountNumber - The seller's account number.
 * @param bankCode - The seller's bank code.
 * @param userId - The seller's user ID.
 * @returns {Promise<{success: boolean, recipient_code?: string, error?: string}>}
 */
export async function createTransferRecipientAction(name: string, accountNumber: string, bankCode: string, userId: string) {
    if (!PAYSTACK_SECRET_KEY) {
        console.error("Paystack secret key is not set.");
        return { success: false, error: 'Server configuration error.' };
    }

    const supabase = createSupabaseServerClient();
    
    try {
        const response = await axios.post(`${PAYSTACK_API_URL}/transferrecipient`, {
            type: "nuban",
            name,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: "NGN"
        }, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
        });

        if (response.data.status) {
            const recipient_code = response.data.data.recipient_code;
            
            // Save recipient code to the seller's profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ recipient_code })
                .eq('id', userId);

            if (updateError) {
                console.error('Error saving recipient code:', updateError);
                return { success: false, error: 'Could not save recipient details. Please try again.' };
            }
            
            return { success: true, recipient_code };
        } else {
            return { success: false, error: response.data.message };
        }
    } catch (error: any) {
        console.error("Error creating transfer recipient:", error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'An error occurred.' };
    }
}


/**
 * Initiates a transfer to a seller.
 * @param amount - The amount to transfer (in kobo).
 * @param recipientCode - The Paystack recipient code for the seller.
 * @param reason - The reason for the transfer.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function initiateTransferAction(amount: number, recipientCode: string, reason: string) {
    if (!PAYSTACK_SECRET_KEY) {
        console.error("Paystack secret key is not set.");
        return { success: false, error: 'Server configuration error.' };
    }

    try {
        const response = await axios.post(`${PAYSTACK_API_URL}/transfer`, {
            source: "balance",
            amount: Math.round(amount * 100), // Convert to kobo
            recipient: recipientCode,
            reason
        }, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
        });

        if (response.data.status) {
            return { success: true, data: response.data.data };
        } else {
            return { success: false, error: response.data.message };
        }
    } catch (error: any) {
        console.error("Error initiating transfer:", error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'An error occurred during transfer.' };
    }
}
