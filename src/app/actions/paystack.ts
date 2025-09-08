
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
 * Releases escrowed funds to a seller after a buyer confirms delivery.
 * @param transactionId - The ID of the transaction to release funds for.
 * @returns An object with either a success status or an error message.
 */
export async function releaseEscrowAction(transactionId: string) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be logged in." };
    }
    
    // Using an RPC function to handle the entire logic securely on the database side.
    const { error } = await supabase.rpc('handle_escrow_release', {
        p_transaction_id: transactionId,
        p_buyer_id: user.id
    });
    
    if (error) {
        console.error("Escrow release error:", error);
        return { success: false, error: error.message };
    }
    
    return { success: true };
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
    
    // Use an RPC function to ensure only the correct seller can update the status.
    const { error } = await supabase.rpc('handle_mark_delivered', {
        p_transaction_id: transactionId,
        p_seller_id: user.id
    });
    
    if (error) {
        console.error("Mark as delivered error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
