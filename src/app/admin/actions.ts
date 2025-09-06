
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
  paystack_ref: string | null;
  product_details: {
    name: string;
    seller_name: string; // This might be stale, but good for a fallback
  } | null;
  seller_id: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  seller_name: string | null;
  seller_email: string | null;
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
    // Query the new view instead of performing complex joins
    const { data, error } = await supabase
        .from('disputes_with_details')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error in getDisputes server action:', error);
        return { success: false, error: error.message };
    }
    
    return { success: true, data: data as DisputeWithRelations[] };
}
