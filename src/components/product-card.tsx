
"use client"

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, MessageCircle, ShoppingCart, Truck } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

type ProductCardProps = {
  product: Product;
  actions?: React.ReactNode;
};

export function ProductCard({ product, actions }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleBuyClick = () => {
    addToCart(product);
  };
  
  const displayImage = Array.isArray(product.image) && product.image.length > 0
    ? product.image[0]
    : typeof product.image === 'string'
    ? product.image
    : 'https://placehold.co/600x400';

  return (
    <Card className="flex flex-col overflow-hidden h-full transition-shadow hover:shadow-lg rounded-none sm:rounded-lg">
      <CardHeader className="p-0 relative aspect-[4/3]">
        <Link href={`/product/${product.id}`} aria-label={product.name}>
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
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
            {product.deliveryFee && product.deliveryFee > 0 && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                    <span>Delivery Fee: ₦{product.deliveryFee.toLocaleString()}</span>
                </div>
            )}
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
              <span>{product.location}</span>
            </div>
        </div>
        <div className="w-full flex flex-col sm:flex-row gap-2">
          {actions ? (
            actions
          ) : (
            <>
              <Button size="sm" variant="default" className="w-full">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact
              </Button>
              <Button size="sm" variant="default" onClick={handleBuyClick} className="w-full">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Buy
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
