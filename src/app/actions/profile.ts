
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createTransferRecipientAction } from './paystack';

type PaymentDetails = {
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_code: string;
};

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
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing cookies.
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing cookies.
          }
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Auth Error in updatePaymentDetailsAction:', authError);
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
    console.error('Supabase profile update failed:', profileUpdateError);
    return { error: `Database error: ${profileUpdateError.message}` };
  }

  revalidatePath('/profile');
  return { success: true };
}
