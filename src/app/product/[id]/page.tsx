
"use client"

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductDetails } from '@/components/product-details';
import { RecommendedProducts } from '@/components/recommended-products';
import { supabase } from '@/lib/supabase-client';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

type ProductPageProps = {
  params: { id: string };
};

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('id', params.id)
        .single();
      
      if (error) {
        console.error("Error fetching product:", error.message || error);
        setProduct(null);
      } else {
        const transformedData = {
          ...data,
          image: (data as any).image_url || [],
          postedDate: (data as any).posted_date,
          deliveryFee: (data as any).delivery_fee,
          price: (data as any).price || 0,
          category: (data as any).category || '',
          location: (data as any).location || '',
          condition: (data as any).condition || 'Used',
          description: (data as any).description || '',
        } as Product;
        setProduct(transformedData);
      }
      setLoading(false);
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);


  if (loading) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                <div>
                  <Skeleton className="w-full aspect-video rounded-lg" />
                  <div className="grid grid-cols-5 gap-2 mt-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-md" />)}
                  </div>
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-12 w-1/2" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </main>
            <Footer />
        </div>
    )
  }

  if (!product) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                <h1 className="text-4xl font-bold">404 - Product Not Found</h1>
                <p className="mt-4 text-lg text-muted-foreground">Sorry, we couldn't find the product you were looking for.</p>
            </main>
            <Footer />
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/20">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetails product={product} />
        <RecommendedProducts product={product} />
      </main>
      <Footer />
    </div>
  );
}
