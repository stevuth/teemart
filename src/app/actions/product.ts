
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Product } from '@/lib/types';

type ProductData = Omit<Product, 'id' | 'postedDate' | 'seller'> & {
    id?: string; // id is optional for creation
    image_url: string[];
}

export async function createOrUpdateProductAction(productData: ProductData) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to manage products.' };
    }

    const { id, ...dataToUpsert } = productData;

    try {
        let result;
        if (id) {
            // Update existing product
            result = await supabase
                .from('products')
                .update({ ...dataToUpsert, user_id: user.id })
                .eq('id', id)
                .select()
                .single();
        } else {
            // Create new product
            result = await supabase
                .from('products')
                .insert({ ...dataToUpsert, user_id: user.id })
                .select()
                .single();
        }

        const { data, error } = result;

        if (error) {
            console.error('Database operation failed:', error);
            throw new Error(error.message);
        }

        // Revalidate paths to reflect changes
        revalidatePath('/');
        revalidatePath('/profile');
        if (data?.id) {
            revalidatePath(`/product/${data.id}`);
        }

        return { data };

    } catch (error: any) {
        return { error: error.message };
    }
}
