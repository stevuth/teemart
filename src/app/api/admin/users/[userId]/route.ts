
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// This is a server-side only file. The environment variables are safe here.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
    const { userId } = params;
    const { action } = await req.json(); // 'ban' or 'unban'

    if (!userId || !action) {
        return NextResponse.json({ error: 'Missing user ID or action' }, { status: 400 });
    }

    try {
        const { data: { user: requestingUser } } = await supabaseAdmin.auth.getUser(req.cookies.get('supabase-auth-token')?.value ?? '');
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', requestingUser?.id).single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Not an admin' }, { status: 403 });
        }
    } catch(e) {
        return NextResponse.json({ error: 'Forbidden: Could not verify admin role' }, { status: 403 });
    }
    
    if (action === 'ban') {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { ban_duration: '36500d' } // Ban for 100 years, effectively permanent
        );
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }

    if (action === 'unban') {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { ban_duration: 'none' }
        );
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
