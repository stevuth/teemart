
'use server';

import { revalidatePath } from 'next/cache';
import { createTransferRecipientAction } from './paystack';
import { createClient } from '@supabase/supabase-js';

type PaymentDetails = {
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_code: string;
  access_token: string; // The access token is now required
};

export async function updatePaymentDetailsAction(details: PaymentDetails) {
  if (!details.access_token) {
    return { error: 'Missing access token. Please log in again.' };
  }

  // Create a new Supabase client, authenticated with the user's access token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${details.access_token}`,
        },
      },
    }
  );

  // Get the authenticated user from the token
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Auth Error:', authError);
    return { error: 'Authentication failed. Please log in again.' };
  }

  // Step 1: Create Paystack recipient
  const recipientResult = await createTransferRecipientAction(
    details.account_name,
    details.account_number,
    details.bank_code,
  );

  if (!recipientResult.success || !recipientResult.recipient_code) {
    return { error: recipientResult.error || 'Failed to create Paystack recipient.' };
  }

  // Step 2: Update profile in the database
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
    console.error('Supabase update failed:', profileUpdateError);
    return { error: `Database error: ${profileUpdateError.message}` };
  }

  revalidatePath('/profile');
  return { success: true };
}
