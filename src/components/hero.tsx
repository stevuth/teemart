
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function Hero() {
  return (
    <section className="bg-background py-12 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card p-8 sm:p-12 rounded-xl shadow-md max-w-4xl mx-auto text-center">
          <h1 className="text-3xl xxs:text-4xl sm:text-5xl font-bold tracking-tight text-primary">
            Buy More, Sell Faster with TeeMart
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Your all-in-one Nigerian marketplace for phones, cars, electronics, furniture, and real estate properties.
          </p>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
             Start your journey now and find great deals or post your ad today!
          </p>
          <div className="mt-8 max-w-2xl mx-auto">
            <form className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <Input
                  type="search"
                  placeholder="Search for anything..."
                  className="pl-10 h-12 w-full text-base"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              <Button type="submit" size="lg" className="h-12 w-full sm:w-auto px-8">
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
