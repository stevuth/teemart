'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createTransferRecipientAction } from './paystack';
import { revalidatePath } from 'next/cache';

export type State = {
  message: string | null;
  success: boolean;
};

export async function saveBankDetails(prevState: State, formData: FormData): Promise<State> {
  const supabase = createSupabaseServerClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth Error in saveBankDetails:', authError);
      return { success: false, message: 'Authentication failed: You must be logged in.' };
    }

    const rawFormData = {
      bankCode: formData.get('bankCode') as string,
      accountNumber: formData.get('accountNumber') as string,
      accountName: formData.get('accountName') as string,
      bankName: formData.get('bankName') as string,
    };

    if (!rawFormData.bankCode || !rawFormData.accountNumber || !rawFormData.accountName || !rawFormData.bankName) {
      return { success: false, message: 'Missing required bank details.' };
    }

    // Step 1: Create Paystack Transfer Recipient
    const recipientResult = await createTransferRecipientAction(
      rawFormData.accountName,
      rawFormData.accountNumber,
      rawFormData.bankCode
    );

    if (!recipientResult.success || !recipientResult.recipient_code) {
      throw new Error(recipientResult.error || 'Failed to create payment recipient with Paystack.');
    }

    // Step 2: Update Supabase profile
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        bank_name: rawFormData.bankName,
        account_name: rawFormData.accountName,
        account_number: rawFormData.accountNumber,
        bank_code: rawFormData.bankCode,
        recipient_code: recipientResult.recipient_code,
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('Supabase profile update error:', profileUpdateError);
      throw new Error(`Database update failed: ${profileUpdateError.message}`);
    }

    revalidatePath('/profile');
    return { success: true, message: 'Your payment details have been saved.' };

  } catch (error: any) {
    console.error('Error in saveBankDetails action:', error);
    return { success: false, message: error.message || 'An unexpected server error occurred.' };
  }
}
