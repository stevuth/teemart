
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';
import { categories } from '@/lib/types';
import { Car, Home as HomeIcon, Laptop, Lamp, Phone } from 'lucide-react';
import useEmblaCarousel, { type EmblaCarouselType } from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { PrevButton, NextButton } from './embla-carousel-buttons';

type CategoryShowcaseProps = {
  selectedCategory: Category | '';
  onCategorySelect: (category: Category | '') => void;
};

const categoryDetails: Record<Category, { icon: React.ElementType, image: string, hint: string }> = {
  Cars: { icon: Car, image: 'https://i.postimg.cc/z3YhWwh4/Whisk-ff833213b1.jpg', hint: 'modern car' },
  Electronics: { icon: Laptop, image: 'https://i.postimg.cc/zG0jJzH6/Whisk-14f9a6570a.jpg', hint: 'various electronics' },
  'Real Estate': { icon: HomeIcon, image: 'https://i.postimg.cc/Bbtzrff2/Whisk-de675f5563.jpg', hint: 'modern house' },
  Furniture: { icon: Lamp, image: 'https://i.postimg.cc/Gt5LpYGk/Gemini-Generated-Image-oenrlfoenrlfoenr.png', hint: 'stylish furniture' },
  Phones: { icon: Phone, image: 'https://i.postimg.cc/T39RyZVd/Whisk-f500c680e1.jpg', hint: 'smartphone screen' },
};

const TWEEN_FACTOR = 1.2;

export function CategoryShowcase({ selectedCategory, onCategorySelect }: CategoryShowcaseProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false,
    containScroll: 'trimSnaps'
  }, [Autoplay({ delay: 3000, stopOnInteraction: false })]);

  const [tweenValues, setTweenValues] = useState<number[]>([]);
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    if (!emblaApi) return
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [])
  
  const onScroll = useCallback((emblaApi: EmblaCarouselType) => {
    if (!emblaApi) return;

    const engine = emblaApi.internalEngine();
    const scrollProgress = emblaApi.scrollProgress();

    const styles = emblaApi.scrollSnapList().map((scrollSnap, index) => {
      let diffToTarget = scrollSnap - scrollProgress;

      if (engine.options.loop) {
        engine.slideLooper.loopPoints.forEach((loopItem) => {
          const target = loopItem.target();
          if (index === loopItem.index && target !== 0) {
            const sign = Math.sign(target);
            if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
            if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
          }
        });
      }
      return diffToTarget * (-1 / TWEEN_FACTOR) * 100;
    });
    setTweenValues(styles);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    onScroll(emblaApi);
    emblaApi.on('scroll', onScroll).on('select', onSelect).on('reInit', onScroll);
  }, [emblaApi, onScroll, onSelect]);

  return (
    <div className="pb-8 border-b">
      <h2 className="text-2xl font-bold tracking-tight mb-12 text-center">Browse by Category</h2>
      <div className="w-full relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4" style={{ perspective: '1000px' }}>
            {categories.map((category, index) => {
              const { icon: Icon, image, hint } = categoryDetails[category];
              const isSelected = selectedCategory === category;

              return (
                <div 
                    className="flex-shrink-0 flex-grow-0 basis-1/3 sm:basis-1/4 md:basis-1/5 min-w-0 pl-4" 
                    key={category}
                    style={{
                         transform: `rotateY(${tweenValues[index]}deg) scale(${1 - Math.abs(tweenValues[index] / 100)})`,
                         transformOrigin: '50% 50%',
                    }}
                >
                    <div
                        onClick={() => onCategorySelect(isSelected ? '' : category)}
                        className={cn(
                            'group w-full h-36 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ease-in-out',
                            'shadow-md hover:shadow-xl backface-hidden preserve-3d',
                            isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                        )}
                        >
                        <Image
                            src={image}
                            alt={category}
                            fill
                            sizes="(max-width: 768px) 33vw, 20vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint={hint}
                        />
                        <div className={cn(
                            "absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-white bg-black/50 transition-colors duration-300",
                            isSelected ? "bg-primary/70" : "group-hover:bg-black/60"
                        )}>
                            <Icon className="h-8 w-8 mb-1 drop-shadow-lg" />
                            <span className="text-sm font-semibold whitespace-normal leading-tight drop-shadow-lg">{category}</span>
                        </div>
                    </div>
                </div>
              );
            })}
          </div>
        </div>
        <PrevButton onClick={() => emblaApi?.scrollPrev()} disabled={prevBtnDisabled} />
        <NextButton onClick={() => emblaApi?.scrollNext()} disabled={nextBtnDisabled} />
      </div>
    </div>
  );
}
