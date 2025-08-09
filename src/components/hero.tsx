
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Hero() {
  return (
    <section 
      className="relative w-full py-20 sm:py-28 lg:py-32 bg-cover bg-center bg-no-repeat"
    >
      <Image
        src="https://i.postimg.cc/qBNSw40W/Chat-GPT-Image-Aug-9-2025-12-21-37-AM.png"
        alt="Modern living room"
        fill
        className="object-cover"
        priority
        data-ai-hint="modern living room"
      />
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-7xl mx-auto animate-fade-in text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Buy More, Sell Faster with TeeMart
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-200 mb-6 max-w-2xl">
            Your all-in-one Nigerian marketplace for phones, cars, electronics, furniture, and real estate properties. Start your journey now and find great deals or post your ad today!
          </p>
          <div className="mt-8">
            <Button size="lg" className="h-12 text-base rounded-lg font-semibold px-8">
              Browse Listings
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
