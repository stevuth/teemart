'use server';

import { revalidatePath } from 'next/cache';
import { createTransferRecipientAction } from './paystack';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type PaymentDetails = {
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_code: string;
};

/**
 * A Server Action to update the payment details for the currently authenticated user.
 * It also creates a Paystack Transfer Recipient if one doesn't exist.
 * @param details The payment details to save.
 * @returns An object with either a success flag or an error message.
 */
export async function updatePaymentDetailsAction(details: PaymentDetails) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Action Auth Error: Could not get user from session cookie.', authError);
    return { error: 'Authentication Error: You must be logged in to update payment details. Please log in again.' };
  }

  // Create Paystack Transfer Recipient first
  const recipientResult = await createTransferRecipientAction(
    details.account_name,
    details.account_number,
    details.bank_code,
  );

  if (!recipientResult.success || !recipientResult.recipient_code) {
    return { error: recipientResult.error || 'Failed to create payment recipient with Paystack.' };
  }
  
  // Now, update the profile with all details
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      bank_name: details.bank_name,
      account_name: details.account_name,
      account_number: details.account_number,
      bank_code: details.bank_code,
      recipient_code: recipientResult.recipient_code,
    })
    .eq('id', user.id);

  if (profileUpdateError) {
    console.error('Action Error: Supabase update failed:', { code: profileUpdateError.code, message: profileUpdateError.message, details: profileUpdateError.details });
    return { error: `Database error: ${profileUpdateError.message}` };
  }

  revalidatePath('/profile');
  
  return { success: true };
}
