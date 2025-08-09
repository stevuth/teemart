
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';

export function Hero() {
  return (
    <section 
      className="relative w-full py-24 sm:py-28 lg:py-32 bg-cover bg-center bg-no-repeat"
    >
      <Image
        src="https://i.postimg.cc/qBNSw40W/Chat-GPT-Image-Aug-9-2025-12-21-37-AM.png"
        alt="Modern living room"
        fill
        className="object-contain sm:object-cover"
        priority
        data-ai-hint="modern living room"
      />
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-3xl mx-auto animate-fade-in text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Buy More, Sell Faster with TeeMart
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl">
            Your all-in-one Nigerian marketplace for phones, cars, electronics, furniture, and real estate properties. Start your journey now and find great deals or post your ad today!
          </p>
          <div className="mt-8 flex flex-row items-center gap-2 max-w-lg">
            <div className="relative flex-grow">
              <Input
                type="search"
                placeholder="Search for cars, phones, and more..."
                className="pl-10 h-12 text-base bg-white/90 text-card-foreground placeholder:text-muted-foreground focus:bg-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <Button size="lg" className="h-12 text-base rounded-lg font-semibold px-4 sm:px-8 shrink-0">
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
