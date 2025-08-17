
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import type { CartItem } from '@/contexts/cart-context';

type OrderInput = {
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    cartItems: CartItem[];
    subtotal: number;
    shippingFee: number;
    escrowFee: number;
    totalAmount: number;
}

/**
 * Creates a new order in the database.
 * @param {OrderInput} orderData - The data for the new order.
 * @returns {Promise<{success: boolean, error?: string}>} - The result of the operation.
 */
export async function createOrderAction(orderData: OrderInput) {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in to place an order." };
    }
    
    const {
        customer_name,
        customer_phone,
        delivery_address,
        cartItems,
        subtotal,
        shippingFee,
        escrowFee,
        totalAmount
    } = orderData;
    
    // In a real application, you would first process payment via a payment gateway here.
    // For this example, we'll assume payment is successful and proceed to create the order.
    
    // 1. Create the order record
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: user.id,
            customer_name,
            customer_phone,
            delivery_address,
            subtotal,
            shipping_fee: shippingFee,
            escrow_fee: escrowFee,
            total_amount: totalAmount,
            status: 'processing', // Default status
        })
        .select()
        .single();
    
    if (orderError) {
        console.error("Error creating order:", orderError);
        return { error: "Failed to create the order record." };
    }

    // 2. Create the order items records
    const orderItemsData = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
    }));

    const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);
        
    if (orderItemsError) {
        console.error("Error creating order items:", orderItemsError);
        // Here you might want to add logic to delete the created order to avoid orphaned records.
        return { error: "Failed to save the items in your order." };
    }

    return { success: true };
}
