
'use server';

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Creates a new dispute for a transaction.
 * @param transactionId - The ID of the transaction to dispute.
 * @param message - The buyer's message detailing the dispute.
 * @returns An object with either a success status or an error message.
 */
export async function raiseDisputeAction(transactionId: string, message: string) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be logged in to raise a dispute." };
    }

    try {
        // Begin a transaction
        const { data: transactionData, error: transactionError } = await supabase.rpc('handle_raise_dispute', {
            p_transaction_id: transactionId,
            p_buyer_id: user.id,
            p_message: message
        });

        if (transactionError) {
            console.error("Error in handle_raise_dispute RPC:", transactionError);
            throw new Error(transactionError.message);
        }
        
        revalidatePath('/profile');
        revalidatePath('/admin');

        return { success: true };
    } catch (error: any) {
        console.error("Dispute Creation Error:", error);
        return { success: false, error: error.message || "An unexpected error occurred." };
    }
}


/**
 * Resolves a dispute. This can only be called by an authenticated admin.
 * @param disputeId - The ID of the dispute to resolve.
 * @returns An object with either a success status or an error message.
 */
export async function resolveDisputeAction(disputeId: string) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Authentication required.' };
    }

    // Check if the authenticated user is an admin
    const { data: adminProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (profileError || adminProfile?.role !== 'admin') {
        return { success: false, error: 'You do not have permission to perform this action.' };
    }

    const { error: updateError } = await supabase
        .from('disputes')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', disputeId);

    if (updateError) {
        console.error('Error resolving dispute:', updateError);
        return { success: false, error: 'Failed to update dispute status.' };
    }
    
    revalidatePath('/admin');
    return { success: true };
}
