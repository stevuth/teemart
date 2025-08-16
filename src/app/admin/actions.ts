
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// This is a server-side only file. The environment variables are safe here.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verifies if the current user is an admin.
 * Throws an error if not an admin.
 */
async function verifyAdmin() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('You must be logged in to perform this action.');
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (error || profile?.role !== 'admin') {
        throw new Error('Forbidden: You do not have administrative privileges.');
    }
}

/**
 * Server Action to ban a user.
 * @param targetUserId The ID of the user to ban.
 * @returns An object with either a success flag or an error message.
 */
export async function banUser(targetUserId: string) {
    try {
        await verifyAdmin();

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            targetUserId,
            { ban_duration: '36500d' } // Ban for 100 years, effectively permanent
        );

        if (error) throw error;
        
        return { success: true, data };

    } catch (e: any) {
        return { error: e.message };
    }
}

/**
 * Server Action to unban a user.
 * @param targetUserId The ID of the user to unban.
 * @returns An object with either a success flag or an error message.
 */
export async function unbanUser(targetUserId: string) {
    try {
        await verifyAdmin();
        
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            targetUserId,
            { ban_duration: 'none' }
        );
        
        if (error) throw error;

        return { success: true, data };
        
    } catch (e: any) {
        return { error: e.message };
    }
}
