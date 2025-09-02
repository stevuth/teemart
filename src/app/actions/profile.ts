
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createTransferRecipientAction } from './paystack';
import type { z } from 'zod';
import type { paymentDetailsSchema } from '@/components/payment-details-form';

type PaymentDetailsInput = z.infer<typeof paymentDetailsSchema>;

/**
 * Creates a Paystack recipient and updates the user's profile with payment details.
 * This server action is secure and runs with the user's authenticated session.
 * @param {PaymentDetailsInput} paymentData - The verified payment details.
 * @returns {Promise<{success: boolean, error?: string}>} - The result of the operation.
 */
export async function updatePaymentDetailsAction(paymentData: PaymentDetailsInput) {
    // This creates a Supabase client that can reliably read the user's session
    const supabase = createSupabaseServerClient();
    
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Authentication failed: You must be logged in to perform this action.' };
        }

        // Step 1: Create Paystack Transfer Recipient
        const recipientResult = await createTransferRecipientAction(
            paymentData.accountName,
            paymentData.accountNumber,
            paymentData.bankCode
        );

        if (!recipientResult.success || !recipientResult.recipient_code) {
            throw new Error(recipientResult.error || 'Failed to create payment recipient with Paystack.');
        }

        // Step 2: Update the user's profile in Supabase
        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
                bank_name: paymentData.bankName,
                account_name: paymentData.accountName,
                account_number: paymentData.accountNumber,
                bank_code: paymentData.bankCode,
                recipient_code: recipientResult.recipient_code,
            })
            .eq('id', user.id);

        if (profileUpdateError) {
            console.error('Supabase profile update error:', profileUpdateError);
            throw new Error(`Database update failed: ${profileUpdateError.message}`);
        }

        return { success: true };

    } catch (error: any) {
        console.error('Error in updatePaymentDetailsAction:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
