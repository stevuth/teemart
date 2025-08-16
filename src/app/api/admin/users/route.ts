
import { createSupabaseAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabaseAdmin = createSupabaseAdminClient();
    
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 100,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ users });
}
