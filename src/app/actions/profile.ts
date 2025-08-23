
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

type PaymentDetails = {
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_code: string;
};

/**
 * A Server Action to update the payment details for the currently authenticated user.
 * @param details The payment details to save.
 * @returns An object with either a success flag or an error message.
 */
export async function updatePaymentDetailsAction(details: PaymentDetails) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update payment details.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      bank_name: details.bank_name,
      account_name: details.account_name,
      account_number: details.account_number,
      bank_code: details.bank_code,
    })
    .eq('id', user.id);

  if (error) {
    console.error('Server Action Error updating profile:', error);
    return { error: `Database error: ${error.message}` };
  }

  // Revalidate the profile path to ensure the UI updates with the new data.
  revalidatePath('/profile');
  
  return { success: true };
}
