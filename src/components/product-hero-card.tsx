
"use client"

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import type { Product } from '@/lib/types'

type ProductHeroCardProps = {
  product: Product
}

export function ProductHeroCard({ product }: ProductHeroCardProps) {

  return (
    <div className="relative w-full aspect-[21/9] bg-secondary text-white">
        <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            priority
            data-ai-hint={product['data-ai-hint']}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16">
            <div className="max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white shadow-lg">
                    {product.name}
                </h2>
                <p className="mt-4 text-lg md:text-xl text-white/90 shadow-lg max-w-prose">
                    {product.description}
                </p>
                
                <div className="mt-6">
                    <Button asChild size="lg">
                        <Link href={`/product/${product.id}`}>View Product</Link>
                    </Button>
                </div>

            </div>
        </div>
    </div>
  )
}
