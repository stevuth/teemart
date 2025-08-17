
"use client";

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckoutForm } from '@/components/checkout-form';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/back-button';

export default function CheckoutPage() {
  const { cartItems } = useCart();
  
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = cartItems.reduce((acc, item) => acc + (item.deliveryFee || 0) * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
             <div className="text-center py-16 border-2 border-dashed rounded-lg max-w-2xl mx-auto">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-medium">Your cart is empty</h3>
                <p className="mt-2 text-muted-foreground">You can't proceed to checkout with an empty cart.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Start Shopping</Link>
                </Button>
            </div>
          </main>
          <Footer />
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BackButton />
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Secure Checkout</h1>
            <p className="mt-2 text-lg text-muted-foreground">Complete your purchase with TeeMart Escrow Protection.</p>
          </div>
          <CheckoutForm subtotal={subtotal} shippingFee={shippingFee} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
