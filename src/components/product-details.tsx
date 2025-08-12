
"use client"

import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MapPin, MessageCircle, Phone, ShieldCheck, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useCart } from '@/hooks/use-cart';
import { cn } from '@/lib/utils';

type ProductDetailsProps = {
  product: Product;
};

export function ProductDetails({ product }: ProductDetailsProps) {
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const images = Array.isArray(product.image) ? product.image : [product.image];
  const selectedImage = images[selectedImageIndex] || 'https://placehold.co/600x400';

  const handleBuyClick = () => {
    addToCart(product);
  };

  return (
    <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Image Gallery */}
            <div>
                <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                        src={selectedImage}
                        alt={product.name}
                        fill
                        className="object-cover"
                        data-ai-hint={product['data-ai-hint']}
                        key={selectedImageIndex} // force re-render on image change for transition
                        priority
                        sizes="(max-width: 1024px) 90vw, 50vw"
                    />
                </div>
                {images.length > 1 && (
                    <div className="grid grid-cols-5 gap-2 mt-4">
                        {images.map((img, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedImageIndex(index)}
                                className={cn(
                                    "relative aspect-square rounded-md overflow-hidden transition-all",
                                    "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                    selectedImageIndex === index ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
                                )}
                            >
                                <Image
                                    src={img}
                                    alt={`Product thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{product.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{product.category}</Badge>
                    <Badge variant="outline">{product.condition}</Badge>
                </div>
                
                <p className="text-4xl lg:text-5xl font-bold text-primary mt-4">₦{product.price.toLocaleString()}</p>
                
                <p className="text-muted-foreground mt-4 text-base leading-relaxed flex-grow">{product.description}</p>
                
                <div className="flex items-center text-muted-foreground text-sm mt-4">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{product.location}</span>
                </div>

                <div className="mt-6 space-y-3">
                     <Button size="lg" className="w-full text-lg" onClick={handleBuyClick}>
                        <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now
                    </Button>
                    <Button size="lg" variant="default" className="w-full text-lg">
                        <MessageCircle className="mr-2 h-5 w-5" /> Contact Seller
                    </Button>
                </div>

                <div className="mt-6 flex items-center text-sm text-green-600">
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    <span>All transactions are protected by TeeMart Buyer Protection.</span>
                </div>
            </div>
        </div>

        {/* Seller Information */}
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src="https://github.com/shadcn.png" alt="Seller" />
                        <AvatarFallback>SL</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold text-lg">TeeMart Seller</p>
                        <p className="text-sm text-muted-foreground">Member since 2023</p>
                    </div>
                </div>
                <Button variant="outline">
                    <Phone className="mr-2 h-4 w-4" /> Show Contact
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
