
"use client"

import React from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Fade from 'embla-carousel-fade'
import { cn } from '@/lib/utils'

const images = [
  { src: "https://i.postimg.cc/PrLZMxC0/Chat-GPT-Image-Aug-9-2025-12-21-37-AM.png", alt: "Modern living room with furniture", "data-ai-hint": "modern living room" },
  { src: "https://picsum.photos/1920/1080?random=2", alt: "Sleek sports car on a city street", "data-ai-hint": "sleek car" },
  { src: "https://picsum.photos/1920/1080?random=3", alt: "Family enjoying a new home", "data-ai-hint": "happy family home" },
]

export function ImageCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
    Fade(),
  ])

  return (
    <div className="absolute inset-0 overflow-hidden" ref={emblaRef}>
      <div className="flex h-full">
        {images.map((image, index) => (
          <div className="relative flex-[0_0_100%] h-full bg-secondary" key={index}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              priority={index === 0}
              data-ai-hint={image['data-ai-hint']}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
