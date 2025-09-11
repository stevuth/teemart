
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
  Electronics: { icon: Laptop, image: 'https://i.freeimage.host/2024/07/26/KIj4GO7.jpeg', hint: 'various electronics' },
  'Real Estate': { icon: HomeIcon, image: 'https://i.postimg.cc/65w0CwsT/Whisk-a7c6e8d1e782807b76247da4bd2419cadr.jpg', hint: 'modern house' },
  Furniture: { icon: Lamp, image: 'https://i.postimg.cc/Hs3jRbmb/Whisk-tu0nzgyotc.jpg', hint: 'stylish furniture' },
  Phones: { icon: Phone, image: 'https://i.postimg.cc/XNkvB9pt/Whisk-tewmjbimdu.jpg', hint: 'smartphone screen' },
};

export function CategoryShowcase({ selectedCategory, onCategorySelect }: CategoryShowcaseProps) {
  
  return (
    <div className="py-8 border-b">
      <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">Explore Our Categories</h2>

       <div className="w-full overflow-hidden">
        <div className="flex w-max animate-scroll-left hover:pause">
            {[...categories, ...categories].map((category, index) => {
                 const { icon: Icon, image, hint } = categoryDetails[category];
                 const isSelected = selectedCategory === category;
                 return (
                    <div
                        key={`${category}-${index}`}
                        onClick={() => onCategorySelect(isSelected ? '' : category)}
                        className={cn(
                            'relative aspect-video rounded-lg overflow-hidden shadow-lg group cursor-pointer transition-all duration-300 ease-in-out mx-3 flex-shrink-0 w-48 sm:w-64',
                            'hover:scale-105',
                            isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                        )}
                    >
                         <Image
                            src={image}
                            alt={category}
                            fill
                            sizes="(max-width: 640px) 50vw, 20vw"
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
