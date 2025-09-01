
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createTransferRecipientAction } from './paystack';

// This file is no longer used for updating payment details from the form.
// The logic has been moved to the client component `payment-details-form.tsx`
// to align with the working pattern of other forms in the app.
// Keeping the file in case other profile-related server actions are needed in the future.
