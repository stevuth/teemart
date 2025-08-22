
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
 * Saves or updates a user's payment details in their profile.
 * This is a Server Action and uses a server-side Supabase client.
 * @param details The payment details to save.
 * @returns An object with a success or error message.
 */
export async function updatePaymentDetailsAction(
    details: z.infer<typeof PaymentDetailsSchema>
) {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to update your profile.' };
    }
    
    // Validate the incoming data
    const validation = PaymentDetailsSchema.safeParse(details);
    if (!validation.success) {
        const errorMessages = validation.error.errors.map(e => e.message).join(', ');
        return { error: errorMessages };
    }
  
    const { error: updateError } = await supabase
        .from('profiles')
        .update(validation.data)
        .eq('id', user.id);

    if (updateError) {
        console.error('Error updating payment details:', updateError);
        // Check for a specific RLS violation error code
        if (updateError.code === '42501') { 
            return { error: 'Database permission denied. Please ensure the RLS policies in README.md are applied.' };
        }
        return { error: 'Failed to save payment details.' };
    }
  
    return { success: true, message: "Payment details saved successfully." };
}
