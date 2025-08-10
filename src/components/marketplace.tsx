
"use client";

import { useState, useMemo, useCallback } from 'react';
import type { Product, Category, DatePostedOption } from '@/lib/types';
import { ProductFilters } from '@/components/product-filters';
import type { FilterValues as ProductFilterValues } from '@/components/product-filters';
import { ProductCard } from './product-card';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogClose, Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter } from './ui/sheet';
import { ListFilter, X } from 'lucide-react';
import { subDays, isToday, isWithinInterval } from 'date-fns';

type FilterValues = ProductFilterValues & { search: string };

type MarketplaceProps = {
  products: Product[];
  filters: FilterValues;
  onFilterChange: (newFilters: Partial<FilterValues>) => void;
  onClearFilters: () => void;
  onCategoryChange: (category: Category | '') => void;
};

export function Marketplace({ products, filters, onFilterChange, onClearFilters, onCategoryChange }: MarketplaceProps) {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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
    const now = new Date();
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
      
      if(filters.datePosted && filters.datePosted !== 'any') {
        const productDate = new Date(product.postedDate);
        if(filters.datePosted === 'today' && !isToday(productDate)) {
          return false;
        }
        if(filters.datePosted === 'last7days' && !isWithinInterval(productDate, { start: subDays(now, 7), end: now })) {
            return false;
        }
        if(filters.datePosted === 'last30days' && !isWithinInterval(productDate, { start: subDays(now, 30), end: now })) {
            return false;
        }
      }

      return true;
    });
  }, [products, filters]);

  const filtersActive = useMemo(() => {
    return filters.search !== '' ||
           filters.category !== '' ||
           filters.priceRange[0] !== 0 ||
           filters.priceRange[1] !== 150000000 ||
           filters.location !== '' ||
           filters.condition !== '' ||
           filters.datePosted !== 'any';
  }, [filters]);
  
  const handleApplyFilters = (newFilters: ProductFilterValues) => {
    onFilterChange(newFilters);
    setIsFilterModalOpen(false);
  }

  return (
    <div className="pt-8">
        <div className="flex justify-between items-center mb-6 px-4 sm:px-0">
            <h1 className="text-2xl font-bold tracking-tight">Used Products For Sale</h1>
            <div className="lg:hidden">
              <Sheet open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                  <SheetTrigger asChild>
                      <Button>
                          <ListFilter className="mr-2 h-4 w-4" />
                          Filter
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="p-0 h-[90vh] flex flex-col">
                      <ProductFilters 
                          filters={filters} 
                          onApply={handleApplyFilters}
                          onClear={onClearFilters}
                          onClose={() => setIsFilterModalOpen(false)} 
                      />
                  </SheetContent>
              </Sheet>
            </div>
        </div>

        {filtersActive && (
            <div className="mb-4 flex items-center gap-2 text-sm px-4 sm:px-0">
                <span>{filteredProducts.length} results found.</span>
                <Button variant="link" size="sm" onClick={onClearFilters} className="p-0 h-auto">Clear filters</Button>
            </div>
        )}
        
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg mx-4 sm:mx-0">
            <h3 className="text-xl font-medium text-muted-foreground">No products found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or clearing them to see all products.</p>
            <Button onClick={onClearFilters} className="mt-4">Clear All Filters</Button>
          </div>
        )}
      </div>
  );
}
