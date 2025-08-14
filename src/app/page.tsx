
"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Marketplace } from '@/components/marketplace';
import { CategoryShowcase } from '@/components/category-showcase';
import type { Category, Product } from '@/lib/types';
import type { FilterValues } from '@/components/product-filters';
import { ProductFilters } from '@/components/product-filters';
import { ProductHeroCarousel } from '@/components/product-hero-carousel';
import { SearchSection } from '@/components/search-section';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [filters, setFilters] = useState<Omit<FilterValues, 'category'>>({
    priceRange: [0, 150000000],
    location: '',
    city: '',
    condition: '',
    datePosted: 'any',
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, seller:profiles!user_id(id, full_name, avatar_url, is_verified)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error.message || error);
        toast({
          title: "Error",
          description: "Could not fetch product listings.",
          variant: "destructive"
        });
        setProducts([]);
      } else {
        const transformedData = (data as any[]).map(item => ({
          ...item,
          image: item.image_url || [],
          postedDate: item.created_at,
          deliveryFee: item.delivery_fee,
          price: item.price || 0,
          category: item.category || '',
          location: item.location || '',
          city: item.city || '',
          condition: item.condition || 'Used',
          description: item.description || '',
          user_id: item.user_id,
          seller: item.seller,
        })) as Product[];
        setProducts(transformedData);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [toast]);


  const handleCategorySelect = (category: Category | '') => {
    setSelectedCategory(category);
  };
  
  const handleFilterChange = (newFilters: Partial<FilterValues>) => {
    if (newFilters.category !== undefined) {
      handleCategorySelect(newFilters.category);
    }
    const { category, ...rest } = newFilters;
    setFilters(prev => ({ ...prev, ...rest }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 150000000],
      location: '',
      city: '',
      condition: '',
      datePosted: 'any',
    });
    setSelectedCategory('');
    setGlobalSearchTerm('');
  };

  const currentFilters: FilterValues & { search: string } = {
    ...filters,
    category: selectedCategory,
    search: globalSearchTerm,
  };
  
  const featuredProducts = products.slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <SearchSection onSearch={setGlobalSearchTerm} />
      {loading ? (
        <Skeleton className="w-full aspect-[21/9]" />
      ) : (
        <ProductHeroCarousel products={featuredProducts} />
      )}
      <main className="flex-grow container mx-auto px-0 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8">
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20">
              <ProductFilters 
                filters={currentFilters}
                onApply={handleFilterChange}
                onClear={clearFilters}
              />
            </div>
          </aside>
          <div className="lg:col-span-3">
            <div className="bg-card rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
                <CategoryShowcase 
                  selectedCategory={selectedCategory} 
                  onCategorySelect={handleCategorySelect} 
                />
                {loading ? (
                  <div className="pt-8">
                    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex flex-col space-y-3">
                          <Skeleton className="h-[125px] w-full rounded-xl" />
                          <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Marketplace 
                    products={products} 
                    filters={currentFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={clearFilters}
                    onCategoryChange={handleCategorySelect}
                  />
                )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
