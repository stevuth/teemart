
"use client";

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Marketplace } from '@/components/marketplace';
import { products } from '@/lib/data';
import { Hero } from '@/components/hero';
import { CategoryShowcase } from '@/components/category-showcase';
import type { Category } from '@/lib/types';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');

  const handleCategorySelect = (category: Category | '') => {
    setSelectedCategory(category);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <Hero />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
            <CategoryShowcase 
              selectedCategory={selectedCategory} 
              onCategorySelect={handleCategorySelect} 
            />
            <Marketplace 
              products={products} 
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategorySelect}
            />
        </div>
      </main>
      <Footer />
    </div>
  );
}
