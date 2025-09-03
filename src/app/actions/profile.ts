
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createTransferRecipientAction } from '@/app/actions/paystack';

type UpdateDetailsInput = {
    bankCode: string;
    accountNumber: string;
    bankName: string;
};

export async function updatePaymentDetailsAction(input: UpdateDetailsInput) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Authentication failed: You must be logged in.' };
    }
        
    try {
        const { bankCode, accountNumber, bankName } = input;

        const recipientResult = await createTransferRecipientAction(
            accountNumber,
            bankCode
        );

        if (!recipientResult.success || !recipientResult.data) {
            throw new Error(recipientResult.error || 'Failed to create payment recipient with Paystack.');
        }

        const { account_name, recipient_code } = recipientResult.data;

        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
                bank_name: bankName,
                account_name: account_name,
                account_number: accountNumber,
                bank_code: bankCode,
                recipient_code: recipient_code,
            })
            .eq('id', user.id);

        if (profileUpdateError) {
            console.error('Supabase profile update error:', profileUpdateError);
            throw new Error(`Database update failed: ${profileUpdateError.message}`);
        }

        return { success: true, message: 'Your payment details have been saved.' };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
