
"use client"

import React from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import Autoplay from 'embla-carousel-autoplay'
import { Card } from "@/components/ui/card"
import type { Product } from '@/lib/types'

type ProductHeroCardProps = {
  product: Product
}

const placeholderImages = (hint: string = 'product') => [
    `https://i.postimg.cc/qBNSw40W/Chat-GPT-Image-Aug-9-2025-12-21-37-AM.png`,
    `https://placehold.co/1200x600/CBD5E0/4A5568?text=${hint.replace(/\s/g,'%20')}-2`,
    `https://placehold.co/1200x600/A0AEC0/4A5568?text=${hint.replace(/\s/g,'%20')}-3`,
];


export function ProductHeroCard({ product }: ProductHeroCardProps) {
  const innerCarouselPlugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  );
  
  const images = placeholderImages(product['data-ai-hint']);

  return (
    <Card className="w-full max-w-4xl overflow-hidden shadow-lg">
        <Carousel
            opts={{ loop: true }}
            plugins={[innerCarouselPlugin.current]}
            className="w-full h-full"
        >
            <CarouselContent>
            {images.map((src, index) => (
                <CarouselItem key={index}>
                <div className="aspect-video relative">
                    <Image
                        src={src}
                        alt={`${product.name} image ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                    />
                </div>
                </CarouselItem>
            ))}
            </CarouselContent>
        </Carousel>
    </Card>
  )
}
