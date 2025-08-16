
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: This should be the only place where the admin client is created.
// It should not be used in client-side code.
export const createSupabaseAdminClient = () => {
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or service role key is not defined. Check your .env.local file.');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
