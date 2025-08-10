
"use client"

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, MessageCircle, ShoppingCart } from 'lucide-react';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden h-full transition-shadow hover:shadow-lg rounded-none sm:rounded-lg">
      <CardHeader className="p-0 relative">
        <Link href={`/product/${product.id}`} aria-label={product.name}>
          <Image
            src={product.image}
            alt={product.name}
            width={600}
            height={400}
            className="w-full h-32 object-cover sm:h-40"
            data-ai-hint={product['data-ai-hint']}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 flex-grow">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Badge variant="outline" className="text-xs">{product.category}</Badge>
          <Badge variant="outline" className="text-xs">{product.condition}</Badge>
        </div>
        <CardTitle className="text-base sm:text-lg font-bold leading-tight">
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
        <div className="w-full flex flex-col sm:flex-row gap-2">
            <Button size="sm" variant="default" className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact
            </Button>
            <Button size="sm" variant="default" className="w-full">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
