'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

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
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  );

  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  if (getUserError || !user) {
    console.error('Action Error: User not authenticated.', getUserError);
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
    console.error('Action Error: Supabase update failed:', { code: error.code, message: error.message, details: error.details });
    return { error: `Database error: ${error.message}` };
  }

  revalidatePath('/profile');
  
  return { success: true };
}
