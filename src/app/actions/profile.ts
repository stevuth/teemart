
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createTransferRecipientAction } from '@/app/actions/paystack';

type UpdateDetailsInput = {
    bankCode: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
};

export async function updatePaymentDetailsAction(input: UpdateDetailsInput) {
    try {
        const supabase = createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('Authentication failed: You must be logged in.');
        }

        const { bankCode, accountNumber, accountName, bankName } = input;

        const recipientResult = await createTransferRecipientAction(
            accountName,
            accountNumber,
            bankCode
        );

        if (!recipientResult.success || !recipientResult.recipient_code) {
            throw new Error(recipientResult.error || 'Failed to create payment recipient with Paystack.');
        }

        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
                bank_name: bankName,
                account_name: accountName,
                account_number: accountNumber,
                bank_code: bankCode,
                recipient_code: recipientResult.recipient_code,
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
