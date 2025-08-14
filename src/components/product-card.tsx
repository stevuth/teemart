
"use client"

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, MessageCircle, ShoppingCart, Truck } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ProductCardProps = {
  product: Product;
  actions?: React.ReactNode;
};

export function ProductCard({ product, actions }: ProductCardProps) {
  const { addToCart } = useCart();
  const router = useRouter();

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    addToCart(product);
  };
  
  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    router.push(`/profile/${product.user_id}`);
  }
  
  const images = Array.isArray(product.image) ? product.image : [product.image];
  const hasMultipleImages = images.length > 1;

  return (
    <Link href={`/product/${product.id}`} className="flex h-full group">
        <Card className="flex flex-col overflow-hidden h-full transition-shadow hover:shadow-lg rounded-none sm:rounded-lg w-full">
        <CardHeader className="p-0 relative aspect-[4/3]">
            {hasMultipleImages ? (
            <Carousel className="w-full h-full" opts={{ loop: true }}>
                <CarouselContent>
                {images.map((imgSrc, index) => (
                    <CarouselItem key={index}>
                    <div className="relative block h-full aspect-[4/3]">
                        <Image
                        src={imgSrc || 'https://placehold.co/600x400.png'}
                        alt={`${product.name} image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        data-ai-hint={product['data-ai-hint']}
                        />
                    </div>
                    </CarouselItem>
                ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CarouselNext className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Carousel>
            ) : (
            <div className="relative h-full">
                <Image
                src={images[0] || 'https://placehold.co/600x400.png'}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                data-ai-hint={product['data-ai-hint']}
                />
            </div>
            )}
        </CardHeader>
        <CardContent className="p-3 sm:p-4 flex-grow">
            <div className="flex justify-between items-start gap-2 mb-2">
            <Badge variant="outline" className="text-xs">{product.category}</Badge>
            <Badge variant="outline" className="text-xs">{product.condition}</Badge>
            </div>
            <CardTitle className="text-base sm:text-lg font-bold leading-tight group-hover:underline mb-2">
                {product.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
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
                <span>{product.city}, {product.location}</span>
                </div>
            </div>
            <div className="w-full flex flex-col sm:flex-row gap-2">
            {actions ? (
                actions
            ) : (
                <>
                <Button size="sm" variant="default" onClick={handleBuyClick} className="w-full">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Buy
                </Button>
                 <Button size="sm" variant="default" className="w-full" onClick={handleContactClick}>
                    <MessageCircle className="mr-2 h-4 w-4"/>
                    Contact Seller
                </Button>
                </>
            )}
            </div>
        </CardFooter>
        </Card>
    </Link>
  );
}
