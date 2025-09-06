
'use server';

import { createSupabaseServerClient } from "@/utils/supabase/server";

// Helper function to check if the current user is an admin
async function isAdmin() {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (error) return false;
    
    return profile?.role === 'admin';
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


// Server Action to get all users with their stats
export async function getUsersWithStats() {
    if (!(await isAdmin())) {
        return { success: false, error: 'Permission denied.' };
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_users_with_stats');

    if (error) {
        console.error('Error in getUsersWithStats server action:', error);
        return { success: false, error: error.message };
    }
    
    return { success: true, data: data as UserProfileWithStats[] };
}

// Server action to get all sellers and their products
export async function getSellersWithProducts() {
    if (!(await isAdmin())) {
        return { success: false, error: 'Permission denied.' };
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_sellers_with_products');

    if (error) {
        console.error('Error in getSellersWithProducts server action:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: data as SellerWithProducts[] };
}

// Server action to get all disputes with related data
export async function getDisputes() {
     if (!(await isAdmin())) {
        return { success: false, error: 'Permission denied.' };
    }

    const supabase = createSupabaseServerClient();
    
    // This query is structured to be explicit about relationships.
    // 1. Select all from disputes.
    // 2. Join profiles where the dispute's buyer_id matches the profile id (aliased as 'buyer').
    // 3. Join transactions where the dispute's transaction_id matches the transaction id.
    // 4. From within that transaction join, join profiles again where the transaction's seller_id matches the profile id (aliased as 'seller').
    const { data, error } = await supabase
        .from('disputes')
        .select(`
            *,
            buyer:profiles!disputes_buyer_id_fkey(full_name, email),
            transaction:transactions!disputes_transaction_id_fkey(
                paystack_ref,
                product_details,
                seller:profiles!transactions_seller_id_fkey(email, full_name)
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error in getDisputes server action:', error);
        return { success: false, error: error.message };
    }
    
    return { success: true, data: data as unknown as DisputeWithRelations[] };
}
