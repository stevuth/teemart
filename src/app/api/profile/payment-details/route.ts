
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createTransferRecipientAction } from '@/app/actions/paystack';

export async function POST(request: Request) {
    const supabase = createSupabaseServerClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse(
                JSON.stringify({ error: 'Authentication failed: You must be logged in.' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const body = await request.json();
        const { accountNumber, bankCode } = body;

        if (!accountNumber || !bankCode) {
            return new NextResponse(
                JSON.stringify({ error: 'Account number and bank code are required.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const recipientResult = await createTransferRecipientAction(
            accountNumber,
            bankCode
        );

        if (!recipientResult.success || !recipientResult.data) {
            throw new Error(recipientResult.error || 'Failed to create payment recipient with Paystack.');
        }

        const { account_name, recipient_code, bank_name } = recipientResult.data;

        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
                bank_name: bank_name,
                account_name: account_name,
                account_number: accountNumber,
                bank_code: bankCode,
                recipient_code: recipient_code,
            })
            .eq('id', user.id);

        if (profileUpdateError) {
            console.error('Supabase profile update error:', profileUpdateError);
            throw new Error(`Database update failed: ${profileUpdateError.message}`);
        }

        return NextResponse.json({ message: `Your payment details have been saved for: ${account_name}.` });

    } catch (error: any) {
        console.error("Error in POST /api/profile/bank-details:", error);
        return new NextResponse(
            JSON.stringify({ error: error.message || 'An internal server error occurred.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
