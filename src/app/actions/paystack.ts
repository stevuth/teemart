
'use server';

import axios from 'axios';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import type { CartItem } from '@/contexts/cart-context';
import type { Transaction } from '@/lib/types';

const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = "sk_test_dc2996e32f46e3b88e8e636b2122cba9914cac4d";
const PAYSTACK_PUBLIC_KEY = "pk_test_dcdc77291352593b0249c8bc85c6645a20339f03";


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

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-payment`;

    try {
        const response = await axios.post(`${PAYSTACK_API_URL}/transaction/initialize`, {
            email,
            amount: Math.round(amount * 100), // Convert to kobo
            metadata,
             callback_url: callbackUrl
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
            const { cartItems, buyer_id } = metadata;

            // Use a transaction to ensure all inserts succeed or none do.
            const transactionRecords = await Promise.all(cartItems.map(async (item: CartItem & {image: string[]}) => {
                const productPrice = item.price * item.quantity;
                // These fees should be aligned with what's shown to the user at checkout
                const buyerFee = productPrice * 0.03; 
                const sellerFee = productPrice * 0.02;

                // Fetch seller name for the snapshot
                const { data: sellerProfile, error: sellerError } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', item.user_id)
                    .single();
                
                if (sellerError) throw new Error(`Could not find seller profile for user ID: ${item.user_id}`);

                return {
                    buyer_id,
                    seller_id: item.user_id,
                    product_id: item.id,
                    product_price: productPrice,
                    buyer_fee: buyerFee,
                    seller_fee: sellerFee,
                    shipping_fee: item.deliveryFee || 0,
                    paystack_ref: reference,
                    status: 'pending' as const,
                    product_details: {
                        name: item.name,
                        image: Array.isArray(item.image) ? item.image : [item.image],
                        buyer_name: metadata.customer_name,
                        seller_name: sellerProfile.full_name,
                    }
                };
            }));
            
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
 * Creates a Paystack Transfer Recipient for a seller. This action resolves the account name first.
 * @param accountNumber - The seller's account number.
 * @param bankCode - The seller's bank code.
 * @returns {Promise<{success: boolean, data?: { account_name: string, recipient_code: string }, error?: string}>}
 */
export async function createTransferRecipientAction(accountNumber: string, bankCode: string) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return { success: false, error: 'Authentication failed. You must be logged in.' };
    }

    if (!PAYSTACK_SECRET_KEY) {
        return { success: false, error: 'Server configuration error.' };
    }

    try {
        // 1. Resolve bank account first
        const resolveResponse = await axios.get(`${PAYSTACK_API_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
        });

        if (!resolveResponse.data.status) {
            throw new Error(resolveResponse.data.message || 'Could not verify account details.');
        }
        
        const account_name = resolveResponse.data.data.account_name;

        // 2. Create transfer recipient with the resolved name
        const recipientResponse = await axios.post(`${PAYSTACK_API_URL}/transferrecipient`, {
            type: "nuban",
            name: account_name,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: "NGN"
        }, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
        });

        if (recipientResponse.data.status) {
            const recipient_code = recipientResponse.data.data.recipient_code;
            return { success: true, data: { account_name, recipient_code } };
        } else {
            throw new Error(recipientResponse.data.message);
        }

    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred during Paystack operation.';
        console.error("Error in createTransferRecipientAction:", errorMessage);
        return { success: false, error: errorMessage };
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


/**
 * Releases escrowed funds to a seller for a specific transaction.
 * @param transactionId The ID of the transaction to release.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function releaseEscrowAction(transactionId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated." };
  }

  // 1. Fetch the transaction and ensure the current user is the buyer.
  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('buyer_id', user.id)
    .single();

  if (fetchError || !transaction) {
    return { success: false, error: "Transaction not found or you are not the buyer." };
  }

  if (transaction.status !== 'pending') {
    return { success: false, error: `Transaction is already ${transaction.status}.` };
  }

  // 2. Fetch the seller's profile to get their recipient code.
  const { data: sellerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('recipient_code')
    .eq('id', transaction.seller_id)
    .single();

  if (profileError || !sellerProfile || !sellerProfile.recipient_code) {
    return { success: false, error: "Could not find seller's payment details. The seller may need to set up their bank account." };
  }

  // 3. Calculate the payout amount.
  const payoutAmount = (transaction.product_price - transaction.seller_fee) + transaction.shipping_fee;

  // 4. Initiate the transfer to the seller.
  const transferResult = await initiateTransferAction(
    payoutAmount,
    sellerProfile.recipient_code,
    `Payment for order: ${transaction.product_details.name}`
  );

  if (!transferResult.success) {
    // Note: Don't update transaction status if transfer fails.
    // This allows for retries. You might add more robust retry logic here.
    return { success: false, error: `Paystack transfer failed: ${transferResult.error}` };
  }

  // 5. Update the transaction status in the database to 'released'.
  const { error: updateError } = await supabase
    .from('transactions')
    .update({ status: 'released' })
    .eq('id', transaction.id);

  if (updateError) {
    // This is a critical state. The transfer was made, but DB update failed.
    // Log this for manual intervention.
    console.error(`CRITICAL: Transfer successful for transaction ${transaction.id}, but DB update failed.`, updateError);
    return { success: false, error: "Payment was sent, but there was an error updating the transaction status. Please contact support." };
  }

  return { success: true };
}
