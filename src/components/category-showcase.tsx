
"use client"

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';
import { categories } from '@/lib/types';
import { Car, Home as HomeIcon, Laptop, Lamp, Phone } from 'lucide-react';

type CategoryShowcaseProps = {
  selectedCategory: Category | '';
  onCategorySelect: (category: Category | '') => void;
};

const categoryDetails: Record<Category, { icon: React.ElementType, image: string, hint: string }> = {
  Cars: { icon: Car, image: 'https://i.postimg.cc/4yWZLbcd/Whisk-tqwztm5oty.jpg', hint: 'modern car' },
  Electronics: { icon: Laptop, image: 'https://i.postimg.cc/ZYCfCx75/Whisk-3c594294bf.jpg', hint: 'various electronics' },
  'Real Estate': { icon: HomeIcon, image: 'https://i.postimg.cc/4yVVpyHB/Whisk-ty4mtiwmtg.jpg', hint: 'modern house' },
  Furniture: { icon: Lamp, image: 'https://i.postimg.cc/Hs3jRbmb/Whisk-tu0nzgyotc.jpg', hint: 'stylish furniture' },
  Phones: { icon: Phone, image: 'https://i.postimg.cc/XNkvB9pt/Whisk-tewmjbimdu.jpg', hint: 'smartphone screen' },
};

export function CategoryShowcase({ selectedCategory, onCategorySelect }: CategoryShowcaseProps) {
  
  return (
    <div className="py-8 border-b">
      <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">Explore Our Categories</h2>

      {/* Mobile Carousel */}
      <div className="w-full h-32 flex items-center justify-center perspective-1000 md:hidden">
        <div className="relative w-[var(--carousel-radius)] h-[var(--carousel-radius)] preserve-3d animate-carousel-rotate">
           {categories.map((category, index) => {
              const { icon: Icon, image, hint } = categoryDetails[category];
              const isSelected = selectedCategory === category;
              const angle = (index / categories.length) * 360;

              return (
                 <div
                    key={category}
                    onClick={() => onCategorySelect(isSelected ? '' : category)}
                    className={cn(
                        'absolute top-0 left-0 w-24 h-24 group cursor-pointer transition-all duration-300 ease-in-out backface-hidden',
                         isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                    )}
                    style={{
                        transform: `rotateY(${angle}deg) translateZ(var(--carousel-radius))`,
                    }}
                >
                    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg">
                        <Image
                            src={image}
                            alt={category}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint={hint}
                        />
                        <div className={cn(
                            "absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-white bg-black/50 transition-colors duration-300",
                            isSelected ? "bg-primary/70" : "group-hover:bg-black/60"
                        )}>
                            <Icon className="h-6 w-6 mb-1 drop-shadow-lg" />
                            <span className="text-xs font-semibold whitespace-normal leading-tight drop-shadow-lg">{category}</span>
                        </div>
                    </div>
                 </div>
              )
           })}
        </div>
      </div>
      
       {/* Desktop Scrolling Animation */}
       <div className="hidden md:block w-full overflow-hidden">
        <div className="flex w-max animate-scroll-left hover:pause">
            {[...categories, ...categories].map((category, index) => {
                 const { icon: Icon, image, hint } = categoryDetails[category];
                 const isSelected = selectedCategory === category;
                 return (
                    <div
                        key={`${category}-${index}`}
                        onClick={() => onCategorySelect(isSelected ? '' : category)}
                        className={cn(
                            'relative aspect-video rounded-lg overflow-hidden shadow-lg group cursor-pointer transition-all duration-300 ease-in-out mx-4 flex-shrink-0 w-64',
                            'hover:scale-105',
                            isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                        )}
                    >
                         <Image
                            src={image}
                            alt={category}
                            fill
                            sizes="20vw"
                            className="object-cover transition-transform duration-300"
                            data-ai-hint={hint}
                        />
                        <div className={cn(
                            "absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-white bg-black/50 transition-colors duration-300",
                            isSelected ? "bg-primary/70" : "group-hover:bg-black/60"
                        )}>
                            <Icon className="h-8 w-8 mb-2 drop-shadow-lg" />
                            <span className="text-base font-semibold whitespace-normal leading-tight drop-shadow-lg">{category}</span>
                        </div>
                    </div>
                 )
            })}
        </div>
      </div>
    </div>
  );
}
