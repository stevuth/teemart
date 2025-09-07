
import { NextResponse } from "next/server";
import axios from "axios";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import type { CartItem } from "@/contexts/cart-context";

// This is the correct, secure way to handle server-to-server callbacks.
// We use the Supabase Admin Client to bypass RLS policies, as the user's session
// is not reliably available in this context.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  const redirectUrl = new URL('/verify-payment', req.url)

  if (!reference) {
    redirectUrl.searchParams.set('status', 'failed');
    redirectUrl.searchParams.set('error', 'No payment reference provided.');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { data } = response;

    if (data.data.status === "success") {
      const supabaseAdmin = createSupabaseAdminClient();
      const { metadata } = data.data;

      const { cartItems, buyer_id, customer_name, customer_phone, delivery_address, shipping_fee } = metadata;
       
      if (!cartItems || !buyer_id || !customer_name) {
          console.error("[API Verify Error] Critical metadata missing for order payment.", metadata);
          redirectUrl.searchParams.set('status', 'failed');
          redirectUrl.searchParams.set('error', 'Essential payment metadata was missing.');
          return NextResponse.redirect(redirectUrl);
      }

       const transactionRecords = (cartItems as (CartItem & { image: string[] })[]).map((item) => {
            const productPrice = item.price * item.quantity;
            // Escrow fee is 5% total, split 3% for buyer and 2% for seller.
            const buyerFee = Math.round(productPrice * 0.03); 
            const sellerFee = Math.round(productPrice * 0.02);

            if (!item.seller || !item.seller.full_name) {
                console.error(`[API Verify Error] Seller information is missing for product ID: ${item.id}`, item);
                throw new Error(`Seller information is missing for product ID: ${item.id}`);
            }
            
            return {
                buyer_id,
                seller_id: item.user_id,
                product_id: item.id,
                product_price: productPrice,
                buyer_fee: buyerFee,
                seller_fee: sellerFee,
                shipping_fee: shipping_fee || 0,
                paystack_ref: reference,
                status: 'pending' as const,
                product_details: {
                    name: item.name,
                    image: Array.isArray(item.image) ? item.image : [item.image],
                    buyer_name: customer_name,
                    seller_name: item.seller.full_name,
                    customer_phone: customer_phone,
                    delivery_address: delivery_address,
                }
            };
        });

      const { error: dbError } = await supabaseAdmin.from('transactions').insert(transactionRecords);

      if (dbError) {
          console.error('[API Verify Error] Supabase insert error:', dbError);
          redirectUrl.searchParams.set('status', 'failed');
          redirectUrl.searchParams.set('error', 'Failed to save transaction. Please contact support.');
          return NextResponse.redirect(redirectUrl);
      }
      
      // Redirect to the client page with a success status
      redirectUrl.searchParams.set('status', 'success');
      return NextResponse.redirect(redirectUrl);

    } else {
        redirectUrl.searchParams.set('status', 'failed');
        redirectUrl.searchParams.set('error', `Payment was not successful. Status: ${data.data.status}`);
        return NextResponse.redirect(redirectUrl);
    }
  } catch (error: any) {
     console.error('[API Verify CRITICAL] Verification error:', error.response?.data || error.message);
     redirectUrl.searchParams.set('status', 'failed');
     redirectUrl.searchParams.set('error', 'An unexpected server error occurred during verification.');
     return NextResponse.redirect(redirectUrl);
  }
}
