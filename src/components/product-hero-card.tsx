
"use client"

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import type { Product } from '@/lib/types'
import { Input } from './ui/input';
import { Search } from 'lucide-react';

type ProductHeroCardProps = {
  product: Product
}

export function ProductHeroCard({ product }: ProductHeroCardProps) {

  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9] bg-secondary text-white">
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
                
                <div className="mt-6 max-w-xl">
                    <form className="flex w-full items-center space-x-2 rounded-lg bg-white/20 p-2 backdrop-blur-sm border border-white/30">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/80" />
                            <Input
                            type="search"
                            placeholder="Search for cars, phones, and more..."
                            className="w-full border-none bg-transparent pl-10 text-white placeholder:text-white/80 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-base"
                            />
                        </div>
                        <Button type="submit" size="lg" className="px-6">
                            Search
                        </Button>
                    </form>
                </div>

            </div>
        </div>
    </div>
  )
}
