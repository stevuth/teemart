
"use client"

import React from 'react';
import Image from 'next/image';
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
    </div>
  )
}
