
import { createSupabaseAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
    const userId = params.userId;
    const supabaseAdmin = createSupabaseAdminClient();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
}
