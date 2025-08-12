
"use client"

import React from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/types'

type ProductHeroCardProps = {
  product: Product
}

export function ProductHeroCard({ product }: ProductHeroCardProps) {
  const displayImage = Array.isArray(product.image) && product.image.length > 0
    ? product.image[0]
    : typeof product.image === 'string'
    ? product.image
    : 'https://placehold.co/1920x1080.png';

  return (
    <div className="relative w-full aspect-[21/9] bg-secondary text-white">
        <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-cover"
            priority
            data-ai-hint={product['data-ai-hint']}
        />
    </div>
  )
}
