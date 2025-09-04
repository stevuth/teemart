
'use server';

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { addDays } from "date-fns";

/**
 * Updates a user's ban status. This can only be called by an authenticated admin.
 * @param userId - The ID of the user to update.
 * @param durationDays - The number of days to ban the user for. Pass null to unban.
 * @returns An object with either success status or an error message.
 */
export async function updateUserBanAction(userId: string, durationDays: number | null) {
  const supabase = createSupabaseServerClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return { success: false, error: 'Authentication required.' };
  }

  // Check if the authenticated user is an admin
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }
  
  if (adminUser.id === userId) {
      return { success: false, error: "You cannot ban yourself." };
  }

  const banned_until = durationDays ? addDays(new Date(), durationDays).toISOString() : null;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ banned_until })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };

  } catch (error: any) {
    console.error("Error updating user ban status:", error);
    return { success: false, error: "Failed to update user status in the database." };
  }
}
