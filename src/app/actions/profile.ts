
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { z } from 'zod';

const PaymentDetailsSchema = z.object({
  bank_name: z.string().min(1, "Bank name is required."),
  bank_code: z.string().min(1, "Bank code is required."),
  account_number: z.string().length(10, "Account number must be 10 digits."),
  account_name: z.string().min(1, "Account name is required."),
});

/**
 * Updates the payment details for the currently authenticated user.
 * @param details - The payment details to save.
 * @returns An object with either a success flag or an error message.
 */
export async function updatePaymentDetailsAction(
    details: z.infer<typeof PaymentDetailsSchema>
) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to update your profile.' };
    }

    const validation = PaymentDetailsSchema.safeParse(details);
    if (!validation.success) {
        return { error: validation.error.errors.map(e => e.message).join(', ') };
    }

    const { error } = await supabase
        .from('profiles')
        .update(validation.data)
        .eq('id', user.id);

    if (error) {
        console.error('Error updating payment details:', error);
        return { error: 'Failed to save payment details. Please check database permissions.' };
    }

    return { success: true };
}
