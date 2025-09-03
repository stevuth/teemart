
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createTransferRecipientAction } from '@/app/actions/paystack';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('API Auth Error:', authError);
      return NextResponse.json({ success: false, message: 'Authentication failed: You must be logged in.' }, { status: 401 });
    }

    const body = await request.json();
    const { bankCode, accountNumber, accountName, bankName } = body;

    if (!bankCode || !accountNumber || !accountName || !bankName) {
      return NextResponse.json({ success: false, message: 'Missing required bank details.' }, { status: 400 });
    }

    // Step 1: Create Paystack Transfer Recipient
    const recipientResult = await createTransferRecipientAction(
      accountName,
      accountNumber,
      bankCode
    );

    if (!recipientResult.success || !recipientResult.recipient_code) {
      throw new Error(recipientResult.error || 'Failed to create payment recipient with Paystack.');
    }

    // Step 2: Update Supabase profile
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        recipient_code: recipientResult.recipient_code,
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('Supabase profile update error:', profileUpdateError);
      throw new Error(`Database update failed: ${profileUpdateError.message}`);
    }

    return NextResponse.json({ success: true, message: 'Your payment details have been saved.' });

  } catch (error: any) {
    console.error('Error in saveBankDetails API route:', error);
    return NextResponse.json({ success: false, message: `An unexpected server error occurred: ${error.message}` }, { status: 500 });
  }
}
