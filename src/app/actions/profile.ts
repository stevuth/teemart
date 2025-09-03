
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createTransferRecipientAction } from './paystack';

type FormState = {
    message: string;
    error: boolean;
} | null;

type PaymentDetails = {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    accountName: string;
};

export async function updatePaymentDetailsAction(
  prevState: FormState,
  details: PaymentDetails
): Promise<FormState> {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { message: "You must be logged in to perform this action.", error: true };
    }

    const { accountNumber, bankCode, bankName, accountName } = details;

    if (!accountNumber || !bankCode || !bankName || !accountName) {
        return { message: "All payment details are required.", error: true };
    }
    
    try {
        // Create the transfer recipient on Paystack to get the recipient_code
        const recipientData = await createTransferRecipientAction(accountNumber, bankCode, accountName);
        
        if (!recipientData.success || !recipientData.data) {
            throw new Error(recipientData.error || 'Failed to create Paystack transfer recipient.');
        }
        
        const { recipient_code } = recipientData.data;

        // Update the user's profile in Supabase
        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
                bank_name: bankName,
                account_name: accountName,
                account_number: accountNumber,
                bank_code: bankCode,
                recipient_code: recipient_code,
            })
            .eq('id', user.id);

        if (profileUpdateError) {
             throw new Error(`Database update failed: ${profileUpdateError.message}`);
        }

        return { 
            message: `Your payment details have been successfully saved for ${accountName}.`, 
            error: false,
        };

    } catch (error: any) {
        return { message: error.message, error: true };
    }
}
