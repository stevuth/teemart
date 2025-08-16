
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// This is a server-side only file. The environment variables are safe here.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verifies if the request is made by an authenticated admin user.
 * @param req The NextRequest object.
 * @returns A promise that resolves with an error NextResponse if verification fails, or the admin's user ID if it succeeds.
 */
async function verifyAdmin(req: NextRequest): Promise<{ error?: NextResponse, userId?: string }> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return { error: NextResponse.json({ error: 'Forbidden: Missing Authorization header' }, { status: 401 }) };
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return { error: NextResponse.json({ error: 'Forbidden: Invalid Authorization header format' }, { status: 401 }) };
    }

    // Use the admin client to get user from token. This verifies the token's validity.
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
        const status = userError?.status || 401;
        return { error: NextResponse.json({ error: userError?.message || 'Forbidden: Invalid token' }, { status }) };
    }
    
    // Check the 'profiles' table to confirm the user has the 'admin' role.
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (profileError || profile?.role !== 'admin') {
        return { error: NextResponse.json({ error: 'Forbidden: Not an admin' }, { status: 403 }) };
    }
    
    return { userId: user.id };
}


export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
    const { userId: targetUserId } = params;
    
    try {
        const { action } = await req.json(); // 'ban' or 'unban'
        if (!targetUserId || !action) {
            return NextResponse.json({ error: 'Missing user ID or action' }, { status: 400 });
        }
        
        // Perform admin verification
        const { error: adminError } = await verifyAdmin(req);
        if (adminError) {
            return adminError;
        }

        if (action === 'ban') {
            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
                targetUserId,
                { ban_duration: '36500d' } // Ban for 100 years, effectively permanent
            );
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json(data);
        }

        if (action === 'unban') {
            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
                targetUserId,
                { ban_duration: 'none' }
            );
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (e: any) {
        // Catch any other unexpected errors, like JSON parsing failures.
        return NextResponse.json({ error: 'Bad Request: ' + e.message }, { status: 400 });
    }
}
