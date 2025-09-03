
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createTransferRecipientAction } from '@/app/actions/paystack';
import { z } from 'zod';

const FormSchema = z.object({
  accountNumber: z.string().length(10, { message: "Account number must be 10 digits." }),
  bankCode: z.string().min(1, { message: "Please select a bank." }),
});

export type FormState = {
  errors?: {
    accountNumber?: string[];
    bankCode?: string[];
    api?: string;
  };
  message: string | null;
};

export async function updatePaymentDetailsAction(
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
    const supabase = createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return {
            errors: { api: ['Authentication failed: You must be logged in.'] },
            message: 'Authentication failed: You must be logged in.'
        };
    }
        
    const validatedFields = FormSchema.safeParse({
        accountNumber: formData.get('accountNumber'),
        bankCode: formData.get('bankCode'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid data. Please check your inputs.',
        };
    }
    
    const { accountNumber, bankCode } = validatedFields.data;

    try {
        const recipientResult = await createTransferRecipientAction(
            accountNumber,
            bankCode
        );

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
            console.error('Supabase profile update error:', profileUpdateError);
            throw new Error(`Database update failed: ${profileUpdateError.message}`);
        }

        return { message: `Your payment details have been saved for: ${account_name}.` };

    } catch (error: any) {
        console.error("Error in updatePaymentDetailsAction:", error);
        return { 
            errors: { api: [error.message] },
            message: error.message 
        };
    }
}
