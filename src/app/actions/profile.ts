
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createTransferRecipientAction } from './paystack';

type FormState = {
    message: string;
    error: boolean;
} | null;

export async function updatePaymentDetailsAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { message: "You must be logged in to perform this action.", error: true };
    }

    const accountNumber = formData.get('accountNumber') as string;
    const bankCode = formData.get('bankCode') as string;

    if (!accountNumber || !bankCode) {
        return { message: "Account number and bank code are required.", error: true };
    }
    
    try {
        const recipientResult = await createTransferRecipientAction(accountNumber, bankCode);
        
        if (!recipientResult.success || !recipientResult.data) {
             throw new Error(recipientResult.error || 'Failed to create payment recipient with Paystack.');
        }

        const { account_name, recipient_code, bank_name } = recipientResult.data;

        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
                bank_name: bank_name,
                account_name: account_name,
                account_number: accountNumber,
                bank_code: bankCode,
                recipient_code: recipient_code,
            })
            .eq('id', user.id);

        if (profileUpdateError) {
             throw new Error(`Database update failed: ${profileUpdateError.message}`);
        }

        return { message: `Your payment details have been saved for: ${account_name}.`, error: false };

    } catch (error: any) {
        return { message: error.message, error: true };
    }
}
