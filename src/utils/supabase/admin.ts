
import { createServerClient } from '@supabase/ssr';

// IMPORTANT: This should only be used in SERVER-SIDE code
// where you need to bypass RLS policies, e.g., for system-level operations.
// Never expose the service role key to the client.
export function createSupabaseAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase URL or Service Role Key for admin client');
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {}, // Admin client does not deal with user cookies
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  );
}

    
