import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Search, Heart, User, Store, Menu } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
              <Store className="h-7 w-7" />
              <span className="text-xl font-bold tracking-tight">TeeMart</span>
            </Link>
          </div>
          
          <div className="hidden lg:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Input
                type="search"
                placeholder="Search for cars, phones, and more..."
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <Button variant="outline">
              Sell Product
            </Button>
            <Button variant="ghost" size="icon" aria-label="Watchlist">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Profile">
              <User className="h-5 w-5" />
            </Button>
          </div>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-6 pt-8">
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Search..."
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                  <Button variant="outline">Sell Product</Button>
                  <Button variant="ghost" className="justify-start gap-2">
                    <Heart className="h-5 w-5" /> Watchlist
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2">
                    <User className="h-5 w-5" /> Profile
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
