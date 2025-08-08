"use client";

import { useState, useMemo, useCallback } from 'react';
import type { Product } from '@/lib/types';
import { ProductFilters, type FilterValues } from '@/components/product-filters';
import { ProductCard } from './product-card';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { ListFilter } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

const INITIAL_FILTERS: FilterValues = {
  category: '',
  priceRange: [0, 150000000],
  location: '',
  condition: '',
  search: ''
};

export function Marketplace({ products }: { products: Product[] }) {
  const [filters, setFilters] = useState<FilterValues>(INITIAL_FILTERS);

  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleFilterChange = useCallback((newFilters: Partial<FilterValues>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const toggleWatchlist = useCallback((product: Product) => {
    setWatchlist(prev => {
      const newWatchlist = new Set(prev);
      if (newWatchlist.has(product.id)) {
        newWatchlist.delete(product.id);
        toast({
          title: "Removed from Watchlist",
          description: `${product.name} has been removed from your watchlist.`,
        });
      } else {
        newWatchlist.add(product.id);
        toast({
          title: "Added to Watchlist",
          description: `${product.name} has been added to your watchlist.`,
        });
      }
      return newWatchlist;
    });
  }, [toast]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }
      if (filters.location && product.location !== filters.location) {
        return false;
      }
      if (filters.condition && product.condition !== filters.condition) {
        return false;
      }
      return true;
    });
  }, [products, filters]);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const filtersActive = useMemo(() => JSON.stringify(filters) !== JSON.stringify(INITIAL_FILTERS), [filters]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="hidden lg:block lg:col-span-1">
        <ProductFilters filters={filters} onFilterChange={handleFilterChange} onClear={clearFilters} />
      </div>

      <div className="lg:col-span-3">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Used Products For Sale</h1>
            <div className='lg:hidden'>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm">
                            <ListFilter className="mr-2 h-4 w-4" />
                            Filters
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <ProductFilters filters={filters} onFilterChange={handleFilterChange} onClear={clearFilters} />
                    </SheetContent>
                </Sheet>
            </div>
        </div>

        {filtersActive && (
            <div className="mb-4 flex items-center gap-2 text-sm">
                <span>{filteredProducts.length} results found.</span>
                <Button variant="link" size="sm" onClick={clearFilters} className="p-0 h-auto">Clear filters</Button>
            </div>
        )}
        
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                inWatchlist={watchlist.has(product.id)}
                onWatchlistToggle={toggleWatchlist}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-medium text-muted-foreground">No products found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or clearing them to see all products.</p>
            <Button onClick={clearFilters} className="mt-4">Clear All Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
}
