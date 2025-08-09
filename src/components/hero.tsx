
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import Image from 'next/image';

export function Hero() {
  return (
    <section 
      className="w-full py-20 md:py-28 lg:py-32 relative"
    >
      <Image
        src="https://i.postimg.cc/PrLZMxC0/Chat-GPT-Image-Aug-9-2025-12-21-37-AM.png"
        alt="Modern living room"
        fill
        className="object-cover"
        priority
        data-ai-hint="modern living room"
      />
      <div className="absolute inset-0 bg-black/60 z-10" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Find Your Next Great Buy
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto">
            The best deals on cars, property, electronics, and more in Nigeria.
          </p>
          <div className="mt-10">
            <Button size="lg" className="h-12 text-base rounded-lg font-semibold bg-yellow-500 hover:bg-yellow-600 text-black px-10">
              Browse All Categories
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
