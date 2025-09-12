
"use client";

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Plus, Minus, Truck } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/back-button';
import { useAuth } from '@/hooks/use-auth';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const { supabase } = useAuth(); // Get supabase instance

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = cartItems.reduce((acc, item) => acc + (item.deliveryFee || 0) * item.quantity, 0);
  const total = subtotal + shipping;

  const handleClearCart = () => {
    clearCart();
    toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart.",
    })
  }

  // Function to convert paths to full URLs if they are not already
  const getImageUrl = (imagePath: string | string[] | null | undefined): string => {
    const path = Array.isArray(imagePath) ? imagePath[0] : imagePath;
    if (!path) return 'https://placehold.co/100x100.png'; // Fallback image

    if (!supabase) return path; // Return path if supabase is not available
    if (path.startsWith('http')) {
        return path; // It's already a full URL
    }
    // It's a path, so construct the full URL
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton className="-ml-4" />
        <div className="flex items-center gap-4 my-6">
            <ShoppingCart className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">Your Shopping Cart</h1>
        </div>
        
        {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
                <div className="lg:col-span-2">
                    <div className="border-b">
                        {cartItems.map((item, index) => {
                            const imageUrl = getImageUrl(item.image);
                            return (
                                <div key={item.id}>
                                    <div className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <Image src={imageUrl} alt={item.name} width={100} height={100} className="rounded-lg object-cover" data-ai-hint={item['data-ai-hint']} />
                                            <div className="flex-grow">
                                                <p className="font-semibold text-lg">{item.name}</p>
                                                <p className="text-muted-foreground mt-1">₦{item.price.toLocaleString()}</p>
                                                {item.deliveryFee && item.deliveryFee > 0 && (
                                                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                        <Truck className="h-4 w-4 mr-1.5" />
                                                        <span>Delivery: ₦{item.deliveryFee.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center">
                                            <div className="flex items-center gap-2 border rounded-full p-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                                    <Minus className="h-4 w-4"/>
                                                </Button>
                                                <span className="w-6 text-center font-medium">{item.quantity}</span>
                                                 <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                                    <Plus className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full group" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" />
                                            </Button>
                                        </div>
                                    </div>
                                    {index < cartItems.length - 1 && <Separator />}
                                </div>
                            )
                        })}
                    </div>
                    <Button variant="outline" className="mt-6" onClick={handleClearCart}>Clear Cart</Button>
                </div>
                <div className="lg:col-span-1">
                    <div className="sticky top-24 p-6 rounded-lg bg-background border">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>₦{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Shipping</span>
                                <span>{shipping > 0 ? `₦${shipping.toLocaleString()}` : 'Free'}</span>
                            </div>
                            <Separator className="!my-4" />
                            <div className="flex justify-between font-bold text-xl">
                                <span>Total</span>
                                <span>₦{total.toLocaleString()}</span>
                            </div>
                            <Button asChild className="w-full !mt-6" size="lg">
                                <Link href="/checkout">Proceed to Checkout</Link>
                            </Button>
                        </div>
                    </div>
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
