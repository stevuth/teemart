
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ImageCarousel } from './image-carousel';

export function Hero() {
  return (
    <section 
      className="w-full pt-20 pb-16 md:pt-28 md:pb-24 lg:pt-32 lg:pb-28 relative"
    >
      <ImageCarousel />
      <div className="absolute inset-0 bg-black/50 z-10" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            TeeMart — Nigeria's Classifieds for Cars, Property & More
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto">
            Buy and sell used items safely. Search by category, location, and price — chat with sellers instantly.
          </p>
        </div>

        <div className="mt-10 max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Input
                type="search"
                placeholder="Search cars, apartments, phones..."
                className="h-12 text-base pl-12 rounded-lg bg-white/90 focus:bg-white"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <Button size="lg" className="h-12 text-base rounded-lg font-semibold bg-yellow-500 hover:bg-yellow-600 text-black">
              <Search className="h-5 w-5 mr-2 lg:hidden" />
              Search
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-gray-300">
            <span className="font-semibold">Popular:</span> Toyota Corolla, 2-bedroom in Lekki, iPhone 12
          </p>
        </div>
      </div>
    </section>
  );
}
