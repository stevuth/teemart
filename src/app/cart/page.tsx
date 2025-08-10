
"use client";

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

// Dummy data for cart items
const cartItems = [
  // { id: '1', name: '2018 Toyota Corolla', price: 6800000, quantity: 1, image: 'https://placehold.co/150x100' },
  // { id: '2', name: 'Apple iPhone 12 Pro', price: 350000, quantity: 1, image: 'https://placehold.co/150x100' },
];

export default function CartPage() {

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = cartItems.length > 0 ? 5000 : 0;
  const total = subtotal + shipping;

  return (
    <div className="flex flex-col min-h-screen bg-secondary/20">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
            <ShoppingCart className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">Your Shopping Cart</h1>
        </div>
        
        {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                    <Card>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {/* Cart items would be mapped here */}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>₦{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>₦{shipping.toLocaleString()}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>₦{total.toLocaleString()}</span>
                            </div>
                            <Button className="w-full" size="lg">Proceed to Checkout</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-medium">Your cart is empty</h3>
                <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Start Shopping</Link>
                </Button>
            </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
