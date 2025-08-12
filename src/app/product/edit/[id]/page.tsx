
"use client";

import { useState, useEffect } from 'react';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SellForm } from "@/components/sell-form";
import { supabase } from '@/lib/supabase-client';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import type { Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type EditProductPageProps = {
  params: { id: string };
};

export default function EditProductPage({ params }: EditProductPageProps) {
    const { user, loading: authLoading } = useAuth();
    const { id: productId } = params;
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!user) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select()
                .eq('id', productId)
                .single();

            if (error) {
                console.error("Error fetching product for edit:", error);
                setError("Could not find the requested product.");
            } else if (data.user_id !== user.id) {
                setError("You do not have permission to edit this product.");
            } else {
                 const transformedData = {
                    ...data,
                    image: data.image_url || [],
                    postedDate: data.created_at,
                    deliveryFee: data.delivery_fee,
                    price: data.price || 0,
                    category: data.category || '',
                    location: data.location || '',
                    condition: data.condition || 'Used',
                    description: data.description || '',
                } as Product;
                setProduct(transformedData);
            }
            setLoading(false);
        };

        if (!authLoading) {
            fetchProduct();
        }
    }, [productId, user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                  <div className="max-w-3xl mx-auto space-y-6">
                      <Skeleton className="h-10 w-1/3" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                  </div>
              </main>
              <Footer />
            </div>
        )
    }

    if (error) {
         return (
             <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <h1 className="text-2xl font-bold text-destructive">{error}</h1>
                </main>
                <Footer />
            </div>
         )
    }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {product ? (
            <SellForm existingProduct={product} />
        ) : (
            // This should ideally not be reached if loading and error states are handled
            <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
        )}
      </main>
      <Footer />
    </div>
  );
}
