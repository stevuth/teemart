
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createTransferRecipientAction } from './paystack';
import { cookies } from 'next/headers';

type PaymentDetailsInput = {
    bankCode: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
};

/**
 * Creates a Paystack recipient and updates the user's profile with payment details.
 * This is a self-contained server action that handles its own authentication.
 * @param {PaymentDetailsInput} details - The payment details from the client form.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updatePaymentDetailsAction(details: PaymentDetailsInput) {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient();
    
    // 1. Get the authenticated user from the session cookie
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("Auth Error in updatePaymentDetailsAction:", authError);
        return { success: false, error: "Authentication failed. Please log in and try again." };
    }

    // 2. Create Paystack Transfer Recipient
    const recipientResult = await createTransferRecipientAction(
        details.accountName,
        details.accountNumber,
        details.bankCode,
    );

    if (!recipientResult.success || !recipientResult.recipient_code) {
        return { success: false, error: `Failed to create Paystack recipient: ${recipientResult.error}` };
    }

    // 3. Update the user's profile in Supabase
    const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
            bank_name: details.bankName,
            account_name: details.accountName,
            account_number: details.accountNumber,
            bank_code: details.bankCode,
            recipient_code: recipientResult.recipient_code,
        })
        .eq('id', user.id);

    if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError);
        return { success: false, error: `Failed to save details to your profile: ${profileUpdateError.message}` };
    }

    return { success: true };
}
