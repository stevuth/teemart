
'use server';

import { createClient } from '@supabase/supabase-js';

async function getAdminSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

/**
 * Server Action to ban a user.
 * @param targetUserId The ID of the user to ban.
 * @returns An object with either a success flag or an error message.
 */
export async function banUser(targetUserId: string) {
    try {
        const supabaseAdmin = await getAdminSupabase();

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
        const supabaseAdmin = await getAdminSupabase();
        
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
