
"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from 'embla-carousel-autoplay'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Product } from '@/lib/types'
import { Badge } from './ui/badge'

type FeaturedProductsCarouselProps = {
  products: Product[]
}

export function FeaturedProductsCarousel({ products }: FeaturedProductsCarouselProps) {
  return (
    <section className="w-full py-12 md:py-16 lg:py-20 bg-secondary/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-10">Featured Listings</h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: true,
            })
          ]}
          className="w-full"
        >
          <CarouselContent>
            {products.map((product) => (
              <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Card className="overflow-hidden h-full flex flex-col">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        data-ai-hint={product['data-ai-hint']}
                      />
                       <Badge variant="secondary" className="absolute top-3 left-3">{product.category}</Badge>
                    </div>
                    <CardContent className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold mb-2 leading-snug">
                        <Link href={`/product/${product.id}`} className="hover:text-primary transition-colors">
                            {product.name}
                        </Link>
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 flex-grow">{product.description.substring(0, 100)}...</p>
                      <div className="flex justify-between items-center">
                        <p className="text-2xl font-bold text-primary">₦{product.price.toLocaleString()}</p>
                        <Button asChild>
                           <Link href={`/product/${product.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </section>
  )
}
