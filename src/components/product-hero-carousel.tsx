
"use client"

import React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from 'embla-carousel-autoplay'
import type { Product } from '@/lib/types'
import { ProductHeroCard } from './product-hero-card'

type ProductHeroCarouselProps = {
  products: Product[]
}

export function ProductHeroCarousel({ products }: ProductHeroCarouselProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

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
            {products.map((product) => (
              <CarouselItem key={product.id}>
                <div className="flex justify-center">
                    <ProductHeroCard product={product} />
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
