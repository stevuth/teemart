
"use client";

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Marketplace } from '@/components/marketplace';
import { products } from '@/lib/data';
import { CategoryShowcase } from '@/components/category-showcase';
import type { Category } from '@/lib/types';
import type { FilterValues } from '@/components/product-filters';
import { ProductFilters } from '@/components/product-filters';
import { ProductHeroCarousel } from '@/components/product-hero-carousel';
import { SearchSection } from '@/components/search-section';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [filters, setFilters] = useState<Omit<FilterValues, 'category'>>({
    priceRange: [0, 150000000],
    location: '',
    condition: '',
    datePosted: 'any',
  });

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
      <ProductHeroCarousel products={featuredProducts} />
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
                <Marketplace 
                  products={products} 
                  filters={currentFilters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearFilters}
                  onCategoryChange={handleCategorySelect}
                />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
