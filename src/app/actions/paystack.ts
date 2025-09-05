
'use server';

import axios from 'axios';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import type { CartItem } from '@/contexts/cart-context';
import type { Transaction } from '@/lib/types';

const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_dc2996e32f46e3b88e8e636b2122cba9914cac4d";


/**
 * Initializes a Paystack transaction.
 * @param email - The buyer's email.
 * @param amount - The total amount to be paid (in kobo).
 * @param metadata - Additional data to be stored with the transaction.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function initializeTransactionAction(email: string, amount: number, metadata: any) {
    if (!PAYSTACK_SECRET_KEY) {
        console.error("Paystack secret key is not set.");
        return { success: false, error: 'Server configuration error.' };
    }

    let callbackUrl: string;
    if (metadata.type === 'verification_payment') {
        callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-verification-payment`;
    } else {
        callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-payment`;
    }

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

            // Check payment type from metadata
            if (metadata.type === 'verification_payment') {
                // It's a verification payment
                const { error: profileUpdateError } = await supabase
                    .from('profiles')
                    .update({ verification_payment_status: 'paid' })
                    .eq('id', metadata.user_id);

                if (profileUpdateError) throw profileUpdateError;

                const { error: logPaymentError } = await supabase
                    .from('verification_payments')
                    .insert({
                        user_id: metadata.user_id,
                        amount: data.amount / 100, // Convert from kobo
                        paystack_ref: reference,
                    });
                
                if (logPaymentError) console.error("Failed to log verification payment:", logPaymentError);

            } else {
                // It's an order payment
                const { cartItems, buyer_id } = metadata;

                const transactionRecords = await Promise.all(cartItems.map(async (item: CartItem & {image: string[]}) => {
                    const productPrice = item.price * item.quantity;
                    const buyerFee = productPrice * 0.03; 
                    const sellerFee = productPrice * 0.02;

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
                    return { success: false, error: 'Failed to save transaction details. Please contact support.' };
                }
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
 * Creates a Paystack transfer recipient for a seller.
 * @param name - The seller's full name.
 * @param accountNumber - The seller's account number.
 * @param bankCode - The seller's bank code.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
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
    
    return response.data.data;
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

  // 2. Fetch the seller's profile to get their bank details.
  const { data: sellerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, account_number, bank_code, recipient_code')
    .eq('id', transaction.seller_id)
    .single();

  if (profileError || !sellerProfile) {
    return { success: false, error: "Could not find seller's payment details." };
  }
  
  if (!sellerProfile.account_number || !sellerProfile.bank_code || !sellerProfile.full_name) {
    return { success: false, error: "Seller has not completed their bank account setup." };
  }

  let recipientCode = sellerProfile.recipient_code;

  // 3. If seller does not have a recipient_code, create one.
  if (!recipientCode) {
    try {
        const recipientData = await createTransferRecipient(
            sellerProfile.full_name,
            sellerProfile.account_number,
            sellerProfile.bank_code
        );
        recipientCode = recipientData.recipient_code;

        // Save the new recipient_code to the seller's profile for future use
        const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({ recipient_code: recipientCode })
            .eq('id', transaction.seller_id);

        if (updateProfileError) {
            console.error("Failed to save new recipient code for seller:", updateProfileError);
            // Non-fatal, we can still proceed with the transfer
        }
    } catch(e: any) {
        return { success: false, error: `Could not create payment recipient for seller: ${e.message}`};
    }
  }


  // 4. Calculate the payout amount.
  const payoutAmount = (transaction.product_price - transaction.seller_fee) + transaction.shipping_fee;

  // 5. Initiate the transfer to the seller.
  const transferResult = await initiateTransferAction(
    payoutAmount,
    recipientCode,
    `Payment for order: ${transaction.product_details.name}`
  );

  if (!transferResult.success) {
    // Note: Don't update transaction status if transfer fails.
    // This allows for retries. You might add more robust retry logic here.
    return { success: false, error: `Paystack transfer failed: ${transferResult.error}` };
  }

  // 6. Update the transaction status in the database to 'released'.
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


/**
 * Resolves a bank account number to get the account name.
 * @param accountNumber - The 10-digit NUBAN account number.
 * @param bankCode - The Paystack code for the bank.
 * @returns {Promise<{success: boolean, data?: {account_name: string}, error?: string}>}
 */
export async function resolveAccountNumberAction(accountNumber: string, bankCode: string) {
    if (!PAYSTACK_SECRET_KEY) {
        console.error("Paystack secret key is not set.");
        return { success: false, error: 'Server configuration error.' };
    }

    if (!accountNumber || !bankCode) {
        return { success: false, error: "Account number and bank code are required." };
    }
    
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
            return { success: true, data: { account_name: response.data.data.account_name } };
        } else {
            return { success: false, error: response.data.message };
        }
    } catch (error: any) {
        console.error('Error resolving account:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'Could not verify account details.' };
    }
}


/**
 * Fetches the list of all supported banks from Paystack.
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getBankListAction() {
    if (!PAYSTACK_SECRET_KEY) {
        console.error("Paystack secret key is not set.");
        return { success: false, error: 'Server configuration error.' };
    }

    try {
        const response = await axios.get(`${PAYSTACK_API_URL}/bank?country=nigeria&perPage=100`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
            }
        });

        if (response.data.status) {
            return { success: true, data: response.data.data };
        } else {
            return { success: false, error: response.data.message };
        }
    } catch (error: any) {
        console.error('Error fetching bank list:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'Could not fetch bank list.' };
    }
}
