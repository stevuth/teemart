
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createSupabaseAdminClient } from '@/utils/supabase/admin';

export async function banUser(userId: string) {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '365d',
    });
    return { error };
}

export async function unbanUser(userId: string) {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
    });
    return { error };
}
