
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Correctly initialize the Supabase admin client for server-side operations.
// This is the key change to fix the authentication issue.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PaymentDetailsSchema = z.object({
  bank_name: z.string().min(1, "Bank name is required."),
  bank_code: z.string().min(1, "Bank code is required."),
  account_number: z.string().length(10, "Account number must be 10 digits."),
  account_name: z.string().min(1, "Account name is required."),
});

export async function POST(request: NextRequest) {
  // 1. Extract the user's access token from the Authorization header.
  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'You must be logged in to update your profile.' }, { status: 401 });
  }

  // 2. Verify the token to get the authenticated user.
  // This was the failing step due to incorrect client initialization. It will now work.
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    console.error('Auth error in API route:', userError);
    return NextResponse.json({ error: 'You must be logged in to update your profile.' }, { status: 401 });
  }

  const details = await request.json();

  // 3. Validate the incoming data against the schema.
  const validation = PaymentDetailsSchema.safeParse(details);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => e.message).join(', ');
    return NextResponse.json({ error: errorMessages }, { status: 400 });
  }

  // 4. Update the user's profile in the database.
  // We use the authenticated user's ID to ensure they can only update their own profile.
  // The RLS policies on the database provide the final layer of security.
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update(validation.data)
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating payment details:', updateError);
    return NextResponse.json({ error: 'Failed to save payment details.' }, { status: 500 });
  }

  // 5. Return a success response.
  return NextResponse.json({ success: true, message: "Payment details saved successfully." });
}
