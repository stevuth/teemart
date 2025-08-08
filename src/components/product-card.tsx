"use client"

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin } from 'lucide-react';
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
            className="w-full h-48 object-cover"
            data-ai-hint={product['data-ai-hint'] as string | undefined}
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
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Badge variant="secondary">{product.category}</Badge>
          <Badge variant="outline">{product.condition}</Badge>
        </div>
        <CardTitle className="text-lg font-bold leading-tight">
           <Link href={`/product/${product.id}`} className="hover:text-primary transition-colors">
            {product.name}
           </Link>
        </CardTitle>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div>
            <p className="text-xl font-bold text-primary">₦{product.price.toLocaleString()}</p>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="h-4 w-4 mr-1.5" />
              <span>{product.location}</span>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}
