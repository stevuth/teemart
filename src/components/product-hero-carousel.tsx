
"use client"

import React from 'react'
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from 'embla-carousel-autoplay'
import type { HeroImage } from '@/lib/types'
import { Card } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { GalleryHorizontal } from 'lucide-react';

type ProductHeroCarouselProps = {
  images: HeroImage[]
}

export function ProductHeroCarousel({ images }: ProductHeroCarouselProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  if (!images || images.length === 0) {
    return (
        <section className="w-full bg-secondary/30 py-8">
            <div className="container mx-auto">
                 <div className="relative w-full aspect-[21/9] bg-secondary text-white flex items-center justify-center rounded-lg border-2 border-dashed">
                    <div className="text-center text-muted-foreground">
                        <GalleryHorizontal className="h-12 w-12 mx-auto" />
                        <h3 className="mt-4 text-xl font-medium">Hero Carousel is Empty</h3>
                        <p>An admin needs to upload images to the hero section.</p>
                    </div>
                </div>
            </div>
        </section>
    )
  }

  return (
    <section className="w-full bg-secondary/30">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[plugin.current]}
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          className="w-full"
        >
          <CarouselContent>
            {images.map((image) => (
              <CarouselItem key={image.id}>
                <div className="relative w-full aspect-[21/9] bg-secondary text-white">
                    <Image
                        src={image.image_url}
                        alt={image.alt_text || 'Hero Image'}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 h-10 w-10 text-white bg-black/30 hover:bg-black/50 border-none" />
          <CarouselNext className="absolute right-4 h-10 w-10 text-white bg-black/30 hover:bg-black/50 border-none" />
        </Carousel>
    </section>
  )
}
