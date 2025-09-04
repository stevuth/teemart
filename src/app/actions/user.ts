
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
  console.log(`[Action] Attempting to update ban status for user: ${userId}`);
  const supabase = createSupabaseServerClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    console.error("[Action Error] No admin user is authenticated.");
    return { success: false, error: 'Authentication required.' };
  }
  console.log(`[Action] Admin user authenticated: ${adminUser.email}`);

  // Check if the authenticated user is an admin
  const { data: adminProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single();

  if (profileError) {
      console.error("[Action Error] Failed to fetch admin profile:", profileError);
      return { success: false, error: 'Could not verify admin permissions.' };
  }

  if (adminProfile?.role !== 'admin') {
    console.error(`[Action Error] Permission denied. User ${adminUser.email} is not an admin.`);
    return { success: false, error: 'You do not have permission to perform this action.' };
  }
  console.log(`[Action] Admin permissions verified for ${adminUser.email}.`);
  
  if (adminUser.id === userId) {
      console.warn("[Action Warn] Admin tried to ban themselves.");
      return { success: false, error: "You cannot ban yourself." };
  }

  const banned_until = durationDays ? addDays(new Date(), durationDays).toISOString() : null;
  console.log(`[Action] Setting 'banned_until' for user ${userId} to: ${banned_until}`);

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ banned_until })
      .eq('id', userId);

    if (updateError) {
        console.error("[Action Error] Supabase update failed. Full error object:", updateError);
        throw new Error(`Database error: ${updateError.message} (Code: ${updateError.code})`);
    }

    console.log(`[Action] Successfully updated ban status for user ${userId}.`);
    return { success: true };

  } catch (error: any) {
    console.error("[Action CRITICAL] Error in catch block while updating user ban status:", error);
    return { success: false, error: error.message || "A server error occurred." };
  }
}
