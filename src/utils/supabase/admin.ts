
import { createServerClient } from '@supabase/ssr';
import { type CookieOptions } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// IMPORTANT: This should only be used in SERVER-SIDE code
// where you need to bypass RLS policies, e.g., for system-level operations.
// Never expose the service role key to the client.
export function createSupabaseAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase URL or Service Role Key for admin client');
  }

  // We need to be able to read cookies to get the current user
  // even when using the service role key.
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // The admin client should not set cookies.
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  );
}
