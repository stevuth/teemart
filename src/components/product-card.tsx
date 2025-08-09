
"use client"

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, MessageCircle, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProductCardProps = {
  product: Product;
  inWatchlist: boolean;
  onWatchlistToggle: (product: Product) => void;
};

export function ProductCard({ product, inWatchlist, onWatchlistToggle }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden h-full transition-shadow hover:shadow-lg">
      <CardHeader className="p-0 relative">
        <Link href={`/product/${product.id}`} aria-label={product.name}>
          <Image
            src={product.image}
            alt={product.name}
            width={600}
            height={400}
            className="w-full h-36 sm:h-48 object-cover"
            data-ai-hint={product['data-ai-hint']}
          />
        </Link>
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 h-8 w-8 rounded-full"
          onClick={() => onWatchlistToggle(product)}
          aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Heart className={cn("h-4 w-4", inWatchlist ? "text-red-500 fill-current" : "text-foreground")} />
        </Button>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 flex-grow">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">{product.category}</Badge>
          <Badge variant="outline" className="text-xs">{product.condition}</Badge>
        </div>
        <CardTitle className="text-base font-bold leading-tight">
           <Link href={`/product/${product.id}`} className="hover:text-primary transition-colors">
            {product.name}
           </Link>
        </CardTitle>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-2 flex flex-col items-start gap-3">
        <div>
            <p className="text-lg sm:text-xl font-bold text-primary">₦{product.price.toLocaleString()}</p>
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
              <span>{product.location}</span>
            </div>
        </div>
        <div className="w-full flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 rounded-none">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Seller
            </Button>
            <Button size="sm" className="flex-1 rounded-none">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
