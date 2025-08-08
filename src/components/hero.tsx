import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';

export function Hero() {
  return (
    <section className="w-full bg-gradient-to-b from-secondary/50 via-background to-background pt-16 pb-12 sm:pt-24 sm:pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
            TeeMart — Nigeria's Classifieds for Cars, Property & More
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Buy and sell used items safely. Search by category, location, and price — chat with sellers instantly.
          </p>
        </div>

        <div className="mt-10 max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Input
                type="search"
                placeholder="Search cars, apartments, phones..."
                className="h-12 text-base pl-12 rounded-lg"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <Button size="lg" className="h-12 text-base rounded-lg font-semibold">
              <Search className="h-5 w-5 mr-2 lg:hidden" />
              Search
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <span className="font-semibold">Popular:</span> Toyota Corolla, 2-bedroom in Lekki, iPhone 12
          </p>
        </div>
      </div>
      
      <div className="mt-16 container mx-auto px-4 sm:px-6 lg:px-8 relative h-48 sm:h-64 md:h-80 overflow-hidden hidden md:block">
        <div className="absolute inset-0 flex items-end justify-center gap-4 sm:gap-8">
          <div className="relative w-1/4 h-full transform -translate-y-8 translate-x-12 rotate-[-12deg] opacity-80">
            <Image 
              src="https://placehold.co/400x300" 
              alt="Stylish chair" 
              layout="fill" 
              objectFit="contain" 
              className="rounded-lg"
              data-ai-hint="stylish chair"
            />
          </div>
          <div className="relative w-1/3 h-full z-10 transform scale-110">
            <Image 
              src="https://placehold.co/600x400" 
              alt="Modern white car" 
              layout="fill" 
              objectFit="contain"
              data-ai-hint="white car"
            />
          </div>
          <div className="relative w-1/4 h-full transform translate-y-4 -translate-x-12 rotate-[8deg] opacity-80">
            <Image 
              src="https://placehold.co/400x400" 
              alt="Potted plant" 
              layout="fill" 
              objectFit="contain"
              data-ai-hint="potted plant"
            />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>
    </section>
  );
}
