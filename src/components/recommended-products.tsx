
"use client"

import { useEffect, useState } from 'react';
import type { Product } from '@/lib/types';
import { recommendProducts, RecommendProductsOutput } from '@/ai/flows/product-recommendations';
import { ProductCard } from './product-card';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

type RecommendedProductsProps = {
  product: Product;
};

export function RecommendedProducts({ product }: RecommendedProductsProps) {
  const [recommendations, setRecommendations] = useState<RecommendProductsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Assuming useAuth gives user info, can be adapted

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const result = await recommendProducts({
          productName: product.name,
          productDescription: product.description,
          productCategory: product.category,
          // userHistory: can be added here if available
        });
        setRecommendations(result);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [product]);

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold tracking-tight mb-6">You Might Also Like</h2>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
             <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[125px] w-full rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
          ))}
        </div>
      ) : recommendations && recommendations.recommendedProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {recommendations.recommendedProducts.slice(0, 4).map((rec, index) => {
            const tempProduct: Product = {
                id: `rec-${index}-${product.id}`,
                name: rec.name,
                description: rec.description,
                category: rec.category as any,
                price: Math.floor(Math.random() * (100000 - 10000 + 1)) + 10000,
                image: 'https://placehold.co/600x400',
                'data-ai-hint': 'product placeholder',
                condition: 'Used',
                location: 'Online',
                postedDate: new Date().toISOString()
            }
            
            return (
                <ProductCard 
                    key={tempProduct.id} 
                    product={tempProduct} 
                    inWatchlist={false} 
                    onWatchlistToggle={() => {}}
                />
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground">No recommendations available at the moment.</p>
      )}
    </div>
  );
}
