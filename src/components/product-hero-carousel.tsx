
"use client"

import React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import Autoplay from 'embla-carousel-autoplay'
import type { Product } from '@/lib/types'
import { ProductHeroCard } from './product-hero-card'

type ProductHeroCarouselProps = {
  products: Product[]
}

export function ProductHeroCarousel({ products }: ProductHeroCarouselProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 10000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  return (
    <section className="w-full py-12 bg-secondary/30">
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
        </Carousel>
    </section>
  )
}
