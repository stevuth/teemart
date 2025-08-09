
"use client"

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import Autoplay from 'embla-carousel-autoplay'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Product } from '@/lib/types'

type ProductHeroCardProps = {
  product: Product
}

const placeholderImages = (hint: string = 'product') => [
    `https://i.postimg.cc/qBNSw40W/Chat-GPT-Image-Aug-9-2025-12-21-37-AM.png`,
    `https://placehold.co/800x600/CBD5E0/4A5568?text=${hint.replace(/\s/g,'%20')}-2`,
    `https://placehold.co/800x600/A0AEC0/4A5568?text=${hint.replace(/\s/g,'%20')}-3`,
];


export function ProductHeroCard({ product }: ProductHeroCardProps) {
  const innerCarouselPlugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  );
  
  const images = placeholderImages(product['data-ai-hint']);

  return (
    <Card className="w-full max-w-4xl overflow-hidden shadow-lg">
      <div className="grid md:grid-cols-2">
        <div className="relative">
            <Carousel
                opts={{ loop: true }}
                plugins={[innerCarouselPlugin.current]}
                className="w-full h-full"
            >
                <CarouselContent>
                {images.map((src, index) => (
                    <CarouselItem key={index}>
                    <div className="aspect-[4/3] relative">
                        <Image
                            src={src}
                            alt={`${product.name} image ${index + 1}`}
                            fill
                            className="object-cover"
                        />
                    </div>
                    </CarouselItem>
                ))}
                </CarouselContent>
            </Carousel>
        </div>
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <CardContent className="p-0">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
              {product.name}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-4">{product.description}</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-3xl md:text-4xl font-bold text-primary">₦{product.price.toLocaleString()}</p>
              <Button asChild size="lg" className="w-full sm:w-auto">
                 <Link href={`/product/${product.id}`}>View Details</Link>
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  )
}
