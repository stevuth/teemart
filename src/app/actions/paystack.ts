
'use server';

import { createSupabaseServerClient } from "@/utils/supabase/server";
import axios from "axios";
import { revalidatePath } from "next/cache";
import type { Transaction, ProductSnapshot } from "@/lib/types";

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
 * Verifies a standard order transaction with Paystack and records it.
 * This action uses the user's session and relies on RLS policies to insert data.
 * @param reference - The transaction reference from Paystack.
 * @returns An object with either a success status or an error message.
 */
export async function verifyOrderTransaction(reference: string) {
    if (!PAYSTACK_SECRET_KEY) {
        return { success: false, error: 'Payment provider not configured.' };
    }
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User is not authenticated.' };
    }

    try {
        const response = await axios.get(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        });

        const { data } = response.data;
        if (data.status !== 'success') {
            return { success: false, error: `Payment not successful. Status: ${data.status}` };
        }
        
        const metadata = data.metadata;
        const cartItem = metadata.cartItems?.[0]; // Assuming one seller per transaction for now
        
        if (!cartItem) {
             return { success: false, error: 'Cart information is missing from the transaction metadata.' };
        }

        const productDetails: ProductSnapshot = {
            name: cartItem.name,
            image: cartItem.image,
            buyer_name: metadata.customer_name,
            seller_name: cartItem.seller.full_name,
            customer_phone: metadata.customer_phone,
            delivery_address: metadata.delivery_address,
        };
        
        const transactionData: Omit<Transaction, 'id' | 'created_at'> = {
            buyer_id: user.id,
            seller_id: cartItem.user_id,
            product_id: cartItem.id,
            product_price: cartItem.price * cartItem.quantity,
            shipping_fee: metadata.shipping_fee,
            buyer_fee: (cartItem.price * cartItem.quantity) * 0.03,
            seller_fee: (cartItem.price * cartItem.quantity) * 0.02,
            paystack_ref: reference,
            status: 'pending',
            product_details: productDetails,
        };

        const { error: insertError } = await supabase
            .from('transactions')
            .insert(transactionData);

        if (insertError) {
            console.error("Supabase insert error:", insertError);
            throw new Error(`Failed to save transaction: ${insertError.message}`);
        }

        revalidatePath('/profile');
        return { success: true };

    } catch (error: any) {
        console.error('[Action] Order verification error:', error.response?.data || error.message);
        return { success: false, error: error.message || 'An unexpected server error occurred during verification.' };
    }
}


/**
 * Verifies a verification fee transaction with Paystack and updates the user's profile.
 * This function is secure and intended to be called from a client-side context.
 * It uses the standard Supabase client, NOT the admin client.
 * @param reference - The transaction reference from Paystack.
 * @returns An object with either a success status or an error message.
 */
export async function verifyVerificationFeeTransaction(reference: string) {
     if (!PAYSTACK_SECRET_KEY) {
        return { success: false, error: 'Payment provider not configured.' };
    }
    const supabase = createSupabaseServerClient();

    try {
        const response = await axios.get(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        });
        
        const { data } = response.data;
        if (data.status !== 'success') {
            return { success: false, error: `Payment not successful. Status: ${data.status}` };
        }

        // Call the database function to securely handle the payment processing.
        // This RPC runs with the permissions of the database owner, not the user.
        const { error: rpcError } = await supabase.rpc('handle_successful_verification_payment', {
            p_paystack_ref: reference,
            p_amount: data.amount / 100, // Convert from kobo
            p_user_id: data.metadata.user_id,
        });
        
        if (rpcError) {
            console.error("RPC handle_successful_verification_payment error:", rpcError);
            throw new Error(rpcError.message);
        }
        
        revalidatePath('/profile');
        return { success: true };

    } catch (error: any) {
        console.error('[Action] Verification fee verification error:', error.response?.data || error.message);
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
            
            const { error: updateProfileError } = await supabase
                .from('profiles')
                .update({ recipient_code: recipientCode })
                .eq('id', transaction.seller_id);
            
            if (updateProfileError) {
                console.error(`Failed to save new recipient code for seller ${transaction.seller_id}:`, updateProfileError);
            }
        }
        
        const payoutAmount = transaction.product_price - transaction.seller_fee;
        const reason = `Payout for order: ${transaction.product_details?.name}`;

        await initiateTransfer(recipientCode, payoutAmount, reason);

        const { error: updateError } = await supabase
            .from('transactions')
            .update({ status: 'released' })
            .eq('id', transactionId);

        if (updateError) {
            console.error(`CRITICAL: Transfer initiated for transaction ${transactionId}, but DB update failed:`, updateError);
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
