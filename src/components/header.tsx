
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Store } from 'lucide-react';

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
          
          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button>
              Sell Product
            </Button>
            <Button size="icon" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <Button size="icon" aria-label="Profile">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
