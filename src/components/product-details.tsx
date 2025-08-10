
"use client"

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MapPin, MessageCircle, Phone, ShieldCheck, ShoppingCart, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

type ProductDetailsProps = {
  product: Product;
};

export function ProductDetails({ product }: ProductDetailsProps) {
  return (
    <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Image */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    data-ai-hint={product['data-ai-hint']}
                />
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
                     <Button size="lg" className="w-full text-lg" asChild>
                        <Link href="/cart">
                            <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now
                        </Link>
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
