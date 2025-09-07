
'use server';

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { type Transaction } from "@/lib/types";

// Helper function to check if the current user is an admin
// This still uses the user's context client
async function isAdmin() {
    try {
        const supabase = createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.error("Admin check profile fetch error:", error);
            return false;
        }
        
        return profile?.role === 'admin';
    } catch (e) {
        console.error("Exception in isAdmin:", e);
        return false;
    }
}


// Type definitions
export type UserProfileWithStats = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_verified: boolean;
  created_at: string;
  banned_until: string | null;
  sales_count: number;
  purchases_count: number;
};

export type SellerWithProducts = {
    seller_id: string;
    full_name: string;
    email: string;
    product_count: number;
    products: {
        id: string;
        name: string;
        price: number;
        created_at: string;
        image_url: string[];
    }[];
};

export type DisputeWithRelations = {
  id: string;
  transaction_id: string;
  buyer_id: string;
  message: string;
  status: 'open' | 'resolved';
  created_at: string;
  resolved_at: string | null;
  transaction: {
    paystack_ref: string;
    product_details: {
      name: string;
      seller_name: string;
    };
    seller: {
      email: string | null;
      full_name: string | null;
    } | null;
  } | null;
  buyer: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export type DashboardStats = {
    gross_transaction_value: number;
    total_transactions: number;
    total_commissions: number;
    pending_payouts: number;
    total_paid_to_sellers: number;
};

export type PendingPayout = {
    seller_id: string;
    full_name: string;
    email: string;
    total_payout_due: number;
};

export type AdminTransaction = Transaction & {
  buyer_name: string;
  buyer_email: string;
  seller_name: string;
  seller_email: string;
};


// Server Action to get all users with their stats
export async function getUsersWithStats() {
    try {
        if (!(await isAdmin())) {
            return { success: false, error: 'Permission denied.' };
        }

        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase.rpc('get_users_with_stats');

        if (error) {
            console.error('Error in getUsersWithStats RPC:', error);
            throw new Error(error.message);
        }
        
        return { success: true, data: data as UserProfileWithStats[] };
    } catch (e: any) {
        console.error("Server Action Exception: getUsersWithStats failed.", e);
        return { success: false, error: e.message || "An unexpected server error occurred." };
    }
}

// Server action to get all sellers and their products
export async function getSellersWithProducts() {
    try {
        if (!(await isAdmin())) {
            return { success: false, error: 'Permission denied.' };
        }

        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase.rpc('get_sellers_with_products');

        if (error) {
            console.error('Error in getSellersWithProducts RPC:', error);
            throw new Error(error.message);
        }

        return { success: true, data: data as SellerWithProducts[] };
    } catch (e: any) {
        console.error("Server Action Exception: getSellersWithProducts failed.", e);
        return { success: false, error: e.message || "An unexpected server error occurred." };
    }
}

// Server action to get all disputes with related data
export async function getDisputes() {
     try {
        if (!(await isAdmin())) {
            return { success: false, error: 'Permission denied.' };
        }

        const supabase = createSupabaseAdminClient();
        
        const { data, error } = await supabase
            .from('disputes')
            .select(`
                id,
                transaction_id,
                buyer_id,
                message,
                status,
                created_at,
                resolved_at,
                buyer:profiles!disputes_buyer_id_fkey(full_name, email),
                transaction:transactions(
                    paystack_ref,
                    product_details,
                    seller:profiles!transactions_seller_id_fkey(email, full_name)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error in getDisputes query:', error);
            throw new Error(error.message);
        }
        
        return { success: true, data: data as unknown as DisputeWithRelations[] };
    } catch (e: any) {
        console.error("Server Action Exception: getDisputes failed.", e);
        return { success: false, error: e.message || "An unexpected server error occurred." };
    }
}


// Server action to get dashboard financial stats
export async function getAdminDashboardStats() {
    try {
        if (!(await isAdmin())) {
            return { success: false, error: 'Permission denied.' };
        }
        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
        if (error) {
            console.error('Error fetching dashboard stats RPC:', error);
            throw new Error(error.message);
        }
        // The RPC returns an array with one object, so we return the first element.
        return { success: true, data: data as DashboardStats[] };
    } catch (e: any) {
        console.error("Server Action Exception: getAdminDashboardStats failed.", e);
        return { success: false, error: e.message || "An unexpected server error occurred." };
    }
}

// Server action to get a detailed list of pending payouts
export async function getPendingPayouts() {
    try {
        if (!(await isAdmin())) {
            return { success: false, error: 'Permission denied.' };
        }
        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase.rpc('get_pending_payouts');
        if (error) {
            console.error('Error fetching pending payouts RPC:', error);
            throw new Error(error.message);
        }
        return { success: true, data: data as PendingPayout[] };
    } catch (e: any) {
        console.error("Server Action Exception: getPendingPayouts failed.", e);
        return { success: false, error: e.message || "An unexpected server error occurred." };
    }
}

// Server action to get ALL transactions for the admin panel
export async function getAllTransactions() {
    try {
        if (!(await isAdmin())) {
            return { success: false, error: 'Permission denied.' };
        }
        
        // Use the admin client to bypass RLS
        const supabase = createSupabaseAdminClient();

        // Perform a direct query with joins
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                buyer:profiles!transactions_buyer_id_fkey(full_name, email),
                seller:profiles!transactions_seller_id_fkey(full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching admin transactions:', { message: error.message, details: error.details, hint: error.hint });
            throw new Error(error.message);
        }
        
        // Transform the data to the expected AdminTransaction shape
        const transformedData = data.map((t: any) => ({
            ...t,
            buyer_name: t.buyer?.full_name || 'N/A',
            buyer_email: t.buyer?.email || 'N/A',
            seller_name: t.seller?.full_name || 'N/A',
            seller_email: t.seller?.email || 'N/A',
        }));

        return { success: true, data: transformedData as AdminTransaction[] };

    } catch (e: any) {
        console.error("Server Action Exception: getAllTransactions failed.", e);
        return { success: false, error: e.message || "An unexpected server error occurred." };
    }
}
