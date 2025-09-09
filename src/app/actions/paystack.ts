
'use server';

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import axios from "axios";

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
    const isVerification = (metadata as any)?.type === 'verification_payment';

    const callback_url = isVerification 
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/verify-verification-payment`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/verify-payment`;


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
                callback_url: callback_url,
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
 * Verifies a Paystack transaction and updates the relevant records in the database.
 * This function uses the admin client to bypass RLS for system-level operations.
 * @param reference - The transaction reference from Paystack.
 * @returns An object with either a success status or an error message.
 */
export async function verifyAndProcessTransaction(reference: string) {
    console.log(`[Admin Action] Verifying transaction: ${reference}`);

    if (!PAYSTACK_SECRET_KEY) {
        console.error("[Admin Action Error] Paystack secret key is not set.");
        return { success: false, error: 'Payment provider not configured.' };
    }

    try {
        const response = await axios.get(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        });

        const { data } = response.data;
        console.log("[Admin Action] Paystack verification response:", JSON.stringify(data, null, 2));

        if (data.status !== 'success') {
            return { success: false, error: `Payment not successful. Status: ${data.status}` };
        }

        const supabaseAdmin = createSupabaseAdminClient();
        const { metadata } = data;
        const { type } = metadata;

        if (type === 'verification_payment') {
            const userId = metadata.user_id;
            if (!userId) throw new Error('User ID missing in verification metadata.');

            // Insert into verification_payments
            const { error: paymentError } = await supabaseAdmin
                .from('verification_payments')
                .insert({
                    user_id: userId,
                    amount: data.amount / 100,
                    paystack_ref: reference,
                });
            if (paymentError) throw paymentError;

            // Update profile status
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ verification_payment_status: 'paid' })
                .eq('id', userId);
            if (profileError) throw profileError;
            
            console.log(`[Admin Action] Verification payment for user ${userId} processed successfully.`);
            return { success: true, type: 'verification' };

        } else {
            // Handle standard order payment
            const { cartItems, buyer_id, customer_name, customer_phone, delivery_address, shipping_fee } = metadata;
            if (!cartItems || !buyer_id || !customer_name) {
                throw new Error("Essential order metadata missing.");
            }

            const transactionRecords = cartItems.map((item: any) => ({
                buyer_id,
                seller_id: item.user_id,
                product_id: item.id,
                product_price: item.price * item.quantity,
                buyer_fee: Math.round(item.price * item.quantity * 0.03),
                seller_fee: Math.round(item.price * item.quantity * 0.02),
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
            }));
            
            const { error: dbError } = await supabaseAdmin.from('transactions').insert(transactionRecords);
            if (dbError) throw dbError;

            console.log(`[Admin Action] Order payment for user ${buyer_id} processed successfully.`);
            return { success: true, type: 'order' };
        }

    } catch (error: any) {
        console.error('[Admin Action CRITICAL] Verification error:', error.response?.data || error.message, error.stack);
        return { success: false, error: error.message || 'An unexpected server error occurred during verification.' };
    }
}

/**
 * Creates a Paystack Transfer Recipient for a user.
 * @param name - The full name of the account holder.
 * @param accountNumber - The bank account number.
 * @param bankCode - The Paystack code for the bank.
 * @returns The recipient code from Paystack.
 */
async function createTransferRecipient(name: string, accountNumber: string, bankCode: string) {
    if (!PAYSTACK_SECRET_KEY) throw new Error('Payment provider not configured.');

    try {
        const response = await axios.post(
            `${PAYSTACK_API_URL}/transferrecipient`,
            {
                type: 'nuban',
                name,
                account_number: accountNumber,
                bank_code: bankCode,
                currency: 'NGN',
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data.data.recipient_code;
    } catch (error: any) {
        console.error("Paystack Create Recipient Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create transfer recipient with Paystack.');
    }
}

/**
 * Initiates a Paystack transfer to a recipient.
 * @param recipientCode - The Paystack recipient code.
 * @param amount - The amount to transfer, in kobo.
 * @param reason - The reason for the transfer.
 * @returns The transfer data from Paystack.
 */
async function initiateTransfer(recipientCode: string, amount: number, reason: string) {
    if (!PAYSTACK_SECRET_KEY) throw new Error('Payment provider not configured.');
    
    try {
        const response = await axios.post(
            `${PAYSTACK_API_URL}/transfer`,
            {
                source: 'balance',
                reason,
                amount: Math.round(amount * 100), // Convert to kobo
                recipient: recipientCode,
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data.data;
    } catch (error: any) {
        console.error("Paystack Initiate Transfer Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to initiate transfer with Paystack.');
    }
}


/**
 * Releases escrowed funds to a seller after a buyer confirms delivery.
 * This now involves creating a transfer recipient and initiating a transfer via Paystack.
 * @param transactionId - The ID of the transaction to release funds for.
 * @returns An object with either a success status or an error message.
 */
export async function releaseEscrowAction(transactionId: string) {
    if (!process.env.PAYSTACK_SECRET_KEY) {
        return { success: false, error: "Server is not configured for payments. Please contact support." };
    }

    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be logged in." };
    }
    
    try {
        // Fetch the transaction details using the standard client to enforce RLS
        const { data: transaction, error: fetchError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .eq('buyer_id', user.id) // Ensure the caller is the buyer
            .single();

        if (fetchError || !transaction) {
            console.error("Escrow release fetch error:", fetchError);
            return { success: false, error: "Could not find the transaction or you are not authorized." };
        }

        if (transaction.status !== 'delivered') {
            return { success: false, error: `Cannot release payment. Order status is '${transaction.status}'.` };
        }

        // Call the secure database function to get seller bank details
        const { data: sellerDetails, error: rpcError } = await supabase
            .rpc('get_seller_payout_details_for_buyer', { p_transaction_id: transactionId })
            .single();
        
        if (rpcError || !sellerDetails || !sellerDetails.account_number || !sellerDetails.bank_code) {
             console.error("Error fetching seller payout details via RPC:", rpcError);
             return { success: false, error: "Seller has not configured their bank details for payout, or an error occurred." };
        }

        let recipientCode = sellerDetails.recipient_code;

        // Create transfer recipient if one doesn't exist for the seller
        if (!recipientCode) {
            recipientCode = await createTransferRecipient(
                sellerDetails.account_name,
                sellerDetails.account_number,
                sellerDetails.bank_code
            );
            
            // Save the new recipient code to the seller's profile
            // This requires an admin client as the current user (buyer) cannot write to the seller's profile
            const supabaseAdmin = createSupabaseAdminClient();
            const { error: updateProfileError } = await supabaseAdmin
                .from('profiles')
                .update({ recipient_code: recipientCode })
                .eq('id', transaction.seller_id);
            
            if (updateProfileError) {
                // This is not a fatal error; the transfer can still proceed. Log it for monitoring.
                console.error(`Failed to save new recipient code for seller ${transaction.seller_id}:`, updateProfileError);
            }
        }
        
        // Calculate payout amount (product price - seller fee)
        const payoutAmount = transaction.product_price - transaction.seller_fee;
        const reason = `Payout for order: ${transaction.product_details?.name}`;

        // Initiate the transfer via Paystack
        await initiateTransfer(recipientCode, payoutAmount, reason);

        // Update transaction status to 'released'
        const { error: updateError } = await supabase
            .from('transactions')
            .update({ status: 'released' })
            .eq('id', transactionId);

        if (updateError) {
            // This is a critical situation: a transfer was initiated but the DB status failed to update.
            // This requires manual intervention.
            console.error(`CRITICAL: Transfer initiated for transaction ${transactionId}, but DB update failed:`, updateError);
            // Return a specific error message for the user.
            return { success: false, error: "Transfer initiated but status update failed. Please contact support immediately with your order details." };
        }
    
        return { success: true };

    } catch (error: any) {
        console.error("Release Escrow Action Error:", error);
        return { success: false, error: error.message || "An unexpected error occurred during payout." };
    }
}

/**
 * Marks a transaction as delivered by the seller.
 * @param transactionId - The ID of the transaction to update.
 * @returns An object with either a success status or an error message.
 */
export async function markAsDeliveredAction(transactionId: string) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be logged in as a seller." };
    }
    
    const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('seller_id, status')
        .eq('id', transactionId)
        .single();
    
    if (fetchError) {
        console.error("Mark as delivered fetch error:", fetchError);
        return { success: false, error: "Could not find the transaction." };
    }

    if (transaction.seller_id !== user.id) {
        return { success: false, error: "You are not authorized to update this order." };
    }

    if (transaction.status !== 'pending') {
        return { success: false, error: `Cannot mark as delivered. Order status is already '${transaction.status}'.` };
    }

    const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'delivered' })
        .eq('id', transactionId);
    
    if (updateError) {
        console.error("Mark as delivered update error:", updateError);
        return { success: false, error: "Failed to update the transaction status." };
    }

    return { success: true };
}
