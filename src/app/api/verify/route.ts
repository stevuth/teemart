
import { NextResponse } from "next/server";
import axios from "axios";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import type { CartItem } from "@/contexts/cart-context";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ success: false, message: "Missing reference" }, { status: 400 });
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
      const supabase = createSupabaseServerClient();
      const { metadata } = data.data;

      const { cartItems, buyer_id, customer_name, customer_phone, delivery_address, shipping_fee } = metadata;
       
      if (!cartItems || !buyer_id || !customer_name) {
          console.error("[API Verify Error] Critical metadata missing for order payment.", metadata);
          throw new Error("Essential payment metadata is missing.");
      }

       const transactionRecords = (cartItems as (CartItem & { image: string[] })[]).map((item) => {
            const productPrice = item.price * item.quantity;
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
                }
            };
        });

      const { error: dbError } = await supabase.from('transactions').insert(transactionRecords);

      if (dbError) {
          console.error('[API Verify Error] Supabase insert error:', dbError);
          return NextResponse.json({ success: false, message: 'Failed to save transaction details. Please contact support.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Payment verified successfully", data: data.data });
    } else {
      return NextResponse.json({ success: false, message: "Payment verification failed", data: data.data }, { status: 400 });
    }
  } catch (error: any) {
     console.error('[API Verify CRITICAL] Verification error:', error.response?.data || error.message);
    return NextResponse.json({
      success: false,
      message: "An unexpected error occurred during verification.",
      error: error.message,
    }, { status: 500 });
  }
}
