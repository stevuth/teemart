
'use server';

import { createSupabaseServerClient } from "@/utils/supabase/server";
import axios from "axios";

// This is the correct place to read the environment variable.
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
    console.error("FATAL: Paystack secret key is not set in environment variables. Ensure PAYSTACK_SECRET_KEY is in your .env.local file and the server is restarted.");
}

/**
 * Initializes a Paystack transaction.
 * @param email - The customer's email address.
 * @param amount - The amount to charge, in the smallest currency unit (kobo).
 * @param metadata - An object containing custom data.
 * @returns An object with either the transaction data or an error message.
 */
export async function initializeTransactionAction(email: string, amount: number, metadata: object = {}) {
    const callback_url = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-payment`;

    if (!PAYSTACK_SECRET_KEY) {
        console.error("Paystack key is missing. Ensure PAYSTACK_SECRET_KEY is set in your .env.local file and the server is restarted.");
        return { success: false, error: 'Payment provider not configured. Please contact support.' };
    }
    
    try {
        const response = await axios.post(
            `${PAYSTACK_API_URL}/transaction/initialize`,
            { 
                email, 
                amount: Math.round(amount * 100), // Convert to kobo
                metadata,
                callback_url
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return { success: true, data: response.data.data };
    } catch (error: any) {
        console.error('Paystack Initialization Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'Failed to initialize payment.' };
    }
}


/**
 * Verifies a Paystack transaction and saves the details to the database.
 * @param reference - The transaction reference from Paystack.
 * @returns An object with either a success status or an error message.
 */
export async function verifyTransactionAction(reference: string) {
    console.log(`[Action] Verifying transaction with reference: ${reference}`);
    if (!PAYSTACK_SECRET_KEY) {
        console.error("[Action Error] Paystack secret key is not set.");
        return { success: false, error: 'Payment provider not configured.' };
    }
    
    try {
        const response = await axios.get(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        });
        
        const { data } = response;
        console.log("[Action] Paystack verification response:", data);

        if (data.data.status === 'success') {
            const supabase = createSupabaseServerClient();
            const { metadata } = data.data;
            const { cartItems, buyer_id, customer_name, customer_phone, delivery_address, shipping_fee, type } = metadata;
            
            // Handle Verification Payment
            if (type === 'verification_payment') {
                console.log('[Action] Processing verification payment.');
                 const { error: paymentError } = await supabase
                    .from('verification_payments')
                    .insert({
                        user_id: buyer_id,
                        amount: data.data.amount / 100, // convert from kobo
                        paystack_ref: reference,
                    });

                if (paymentError) {
                    console.error('[Action Error] Supabase verification_payments insert error:', paymentError);
                    throw new Error('Failed to log verification payment.');
                }
                
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ verification_payment_status: 'paid' })
                    .eq('id', buyer_id);

                if (profileError) {
                    console.error('[Action Error] Supabase profiles update error:', profileError);
                    throw new Error('Failed to update user profile after verification payment.');
                }
                
                console.log('[Action] Verification payment processed successfully.');
                return { success: true, message: 'Verification payment confirmed.' };
            }

            // Handle Order Payment
            console.log('[Action] Processing order payment.');
            if (!cartItems || !buyer_id || !customer_name) {
                console.error("[Action Error] Critical metadata missing for order payment.", metadata);
                throw new Error("Essential payment metadata is missing.");
            }

            const transactionRecords = cartItems.map((item: any) => {
                const productPrice = item.price * item.quantity;
                const buyerFee = Math.round(productPrice * 0.03); 
                const sellerFee = Math.round(productPrice * 0.02);

                if (!item.seller || !item.seller.full_name) {
                    console.error(`[Action Error] Seller information is missing for product ID: ${item.id}`, item);
                    throw new Error(`Seller information is missing for product ID: ${item.id}`);
                }
                
                return {
                    buyer_id,
                    seller_id: item.user_id,
                    product_id: item.id,
                    product_price: productPrice,
                    buyer_fee: buyerFee,
                    seller_fee: sellerFee,
                    shipping_fee: shipping_fee || 0,
                    paystack_ref: reference,
                    status: 'pending' as const,
                    product_details: {
                        name: item.name,
                        image: Array.isArray(item.image) ? item.image : [item.image],
                        buyer_name: customer_name,
                        seller_name: item.seller.full_name,
                        customer_phone: customer_phone,
                        delivery_address: delivery_address,
                    }
                };
            });
            
            console.log("[Action] Prepared transaction records:", JSON.stringify(transactionRecords, null, 2));

            const { error: dbError } = await supabase.from('transactions').insert(transactionRecords);

            if (dbError) {
                console.error('[Action Error] Supabase insert error:', dbError);
                throw new Error('Failed to save transaction details. Please contact support.');
            }
            
            console.log('[Action] Transaction records saved successfully.');
            return { success: true, message: 'Payment verified and order saved.' };

        } else {
            console.warn('[Action Warn] Payment verification failed with status:', data.data.status);
            return { success: false, error: `Payment on Paystack was not successful. Status: ${data.data.status}` };
        }
    } catch (error: any) {
        console.error('[Action CRITICAL] Verification error:', error.response?.data || error.message, error.stack);
        return { success: false, error: error.message || 'An unexpected error occurred during verification.' };
    }
}

/**
 * Updates a transaction's status to 'delivered'. This should be called by the seller.
 * @param transactionId - The ID of the transaction to update.
 * @returns An object with either a success status or an error message.
 */
export async function markAsDeliveredAction(transactionId: string) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to perform this action.' };
    }

    // First, verify the user is the seller for this transaction
    const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('seller_id')
        .eq('id', transactionId)
        .single();
    
    if (fetchError || !transaction) {
        return { success: false, error: 'Transaction not found.' };
    }

    if (transaction.seller_id !== user.id) {
        return { success: false, error: 'You do not have permission to modify this transaction.' };
    }
    
    // If authenticated and authorized, update the status
    const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'delivered' })
        .eq('id', transactionId);

    if (updateError) {
        console.error("Error marking as delivered:", updateError);
        return { success: false, error: 'Failed to update order status.' };
    }

    return { success: true };
}


/**
 * Retrieves a list of banks from Paystack.
 * @returns An object with either the bank list data or an error message.
 */
export async function getBankListAction() {
    if (!PAYSTACK_SECRET_KEY) {
        return { success: false, error: 'Payment provider not configured.' };
    }
    try {
        const response = await axios.get(`${PAYSTACK_API_URL}/bank`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        });
        return { success: true, data: response.data.data };
    } catch (error: any) {
        console.error('Paystack Get Banks Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'Failed to fetch bank list.' };
    }
}

/**
 * Resolves a bank account number to get the account name.
 * @param accountNumber - The account number to resolve.
 * @param bankCode - The bank code for the account.
 * @returns An object with either the resolved account data or an error message.
 */
export async function resolveAccountNumberAction(accountNumber: string, bankCode: string) {
     if (!PAYSTACK_SECRET_KEY) {
        return { success: false, error: 'Payment provider not configured.' };
    }
    try {
        const response = await axios.get(
            `${PAYSTACK_API_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
        );
        return { success: true, data: response.data.data };
    } catch (error: any) {
        console.error('Paystack Resolve Account Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'Could not verify account details.' };
    }
}


/**
 * Releases funds from escrow to a seller.
 * @param transactionId - The ID of the transaction to release.
 * @returns An object with either a success status or an error message.
 */
export async function releaseEscrowAction(transactionId: string) {
    const supabase = createSupabaseServerClient();
    
    // 1. Get transaction details
    const { data: transaction, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
        
    if (transError || !transaction) {
        console.error("Error fetching transaction for escrow release:", transError);
        return { success: false, error: "Transaction not found." };
    }
    
    // Only allow release if the status is 'delivered'
    if (transaction.status !== 'delivered') {
        return { success: false, error: `Cannot release funds. Order must be marked as delivered first. Current status is '${transaction.status}'.` };
    }

    // 2. Get seller's bank details
    const { data: sellerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('recipient_code, bank_name, account_name, account_number, bank_code')
        .eq('id', transaction.seller_id)
        .single();

    if (profileError || !sellerProfile) {
        console.error("Error fetching seller profile for escrow release:", profileError);
        return { success: false, error: "Seller's payment details not found." };
    }
    
    let recipientCode = sellerProfile.recipient_code;

    // 3. Create Paystack transfer recipient if one doesn't exist
    if (!recipientCode) {
        try {
            const response = await axios.post(`${PAYSTACK_API_URL}/transferrecipient`, {
                type: "nuban",
                name: sellerProfile.account_name,
                account_number: sellerProfile.account_number,
                bank_code: sellerProfile.bank_code,
                currency: "NGN"
            }, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } });

            recipientCode = response.data.data.recipient_code;

            // Save the recipient code to the profile for future use
            await supabase
                .from('profiles')
                .update({ recipient_code: recipientCode })
                .eq('id', transaction.seller_id);

        } catch (error: any) {
            console.error('Paystack Create Recipient Error:', error.response?.data || error.message);
            return { success: false, error: error.response?.data?.message || 'Failed to create payment recipient.' };
        }
    }
    
    // 4. Initiate the transfer
    try {
        const amountToTransfer = (transaction.product_price - (transaction.product_price * 0.02)) * 100; // in kobo
        
        await axios.post(`${PAYSTACK_API_URL}/transfer`, {
            source: "balance",
            reason: `Payment for order #${transaction.id.substring(0, 8)}`,
            amount: amountToTransfer,
            recipient: recipientCode
        }, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } });
        
        // 5. Update the transaction status in the database
        const { error: updateError } = await supabase
            .from('transactions')
            .update({ status: 'released' })
            .eq('id', transactionId);
            
        if (updateError) {
            console.error("DB update error after transfer:", updateError);
            // This is a critical state - transfer initiated but DB not updated.
            // Requires manual intervention.
            return { success: true, error: "Transfer initiated, but DB update failed. Please contact support." };
        }

        return { success: true };

    } catch (error: any) {
        console.error('Paystack Transfer Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || 'Failed to initiate transfer.' };
    }
}
