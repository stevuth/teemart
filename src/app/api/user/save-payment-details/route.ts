
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { z } from 'zod';

const PaymentDetailsSchema = z.object({
  bank_name: z.string().min(1, "Bank name is required."),
  bank_code: z.string().min(1, "Bank code is required."),
  account_number: z.string().length(10, "Account number must be 10 digits."),
  account_name: z.string().min(1, "Account name is required."),
});

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();

  // 1. Verify the user session from the cookie
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Auth error in API route:', userError);
    return NextResponse.json({ error: 'You must be logged in to update your profile.' }, { status: 401 });
  }
  
  const details = await request.json();

  // 2. Validate the incoming data
  const validation = PaymentDetailsSchema.safeParse(details);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => e.message).join(', ');
    return NextResponse.json({ error: errorMessages }, { status: 400 });
  }
  
  // 3. Update the user's profile in the database
  const { error: updateError } = await supabase
    .from('profiles')
    .update(validation.data)
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating payment details:', updateError);
    // Provide a more specific error message if it's a permission issue
    if (updateError.code === '42501') { // "new row violates row-level security policy"
        return NextResponse.json({ error: 'Database permission denied. Please check RLS policies.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to save payment details.' }, { status: 500 });
  }
  
  // 4. Return a success response
  return NextResponse.json({ success: true, message: "Payment details saved successfully." });
}
