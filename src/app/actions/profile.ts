
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createTransferRecipientAction } from './paystack';

type UpdatePaymentDetailsInput = {
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_code: string;
};

/**
 * Creates a Paystack transfer recipient and updates the user's profile with payment details.
 * @param {UpdatePaymentDetailsInput} details - The payment details.
 * @returns {Promise<{success: boolean, error?: string}>} - The result of the operation.
 */
export async function updatePaymentDetailsAction(details: UpdatePaymentDetailsInput) {
  const supabase = createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication Error: You must be logged in to update payment details." };
  }

  const { bank_name, account_name, account_number, bank_code } = details;

  try {
    // Step 1: Create Paystack Transfer Recipient
    const recipientResult = await createTransferRecipientAction(
      account_name,
      account_number,
      bank_code
    );

    if (!recipientResult.success || !recipientResult.recipient_code) {
      throw new Error(recipientResult.error || "Failed to create Paystack transfer recipient.");
    }

    // Step 2: Update the user's profile in Supabase
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        bank_name: bank_name,
        account_name: account_name,
        account_number: account_number,
        bank_code: bank_code,
        recipient_code: recipientResult.recipient_code,
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('Supabase profile update error:', profileUpdateError);
      throw new Error(profileUpdateError.message);
    }
    
    return { success: true };

  } catch (error: any) {
    console.error('Error in updatePaymentDetailsAction:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while saving your details.' };
  }
}
