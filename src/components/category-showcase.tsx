
"use client"

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
  Cars: { icon: Car, image: 'https://i.postimg.cc/z3YhWwh4/Whisk-ff833213b1.jpg', hint: 'modern car' },
  Electronics: { icon: Laptop, image: 'https://i.postimg.cc/tJ44xJQW/Whisk-ab1ae9d2c9.jpg', hint: 'laptop workspace' },
  'Real Estate': { icon: HomeIcon, image: 'https://i.postimg.cc/Bbtzrff2/Whisk-de675f5563.jpg', hint: 'modern house' },
  Furniture: { icon: Lamp, image: 'https://i.postimg.cc/Gt5LpYGk/Gemini-Generated-Image-oenrlfoenrlfoenr.png', hint: 'stylish furniture' },
  Phones: { icon: Phone, image: 'https://i.postimg.cc/T39RyZVd/Whisk-f500c680e1.jpg', hint: 'smartphone screen' },
};

export function CategoryShowcase({ selectedCategory, onCategorySelect }: CategoryShowcaseProps) {
  return (
    <div className="pb-8 border-b">
      <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">Browse by Category</h2>
      <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4 -mb-4 hide-scrollbar">
        {categories.map((category) => {
          const { icon: Icon, image, hint } = categoryDetails[category];
          const isSelected = selectedCategory === category;

          return (
            <div
              key={category}
              onClick={() => onCategorySelect(isSelected ? '' : category)}
              className={cn(
                'group relative flex-shrink-0 w-40 h-28 md:w-full md:h-32 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ease-in-out',
                'shadow-md hover:shadow-xl',
                isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
              )}
            >
              <Image
                src={image}
                alt={category}
                fill
                sizes="(max-width: 768px) 40vw, 20vw"
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
          );
        })}
      </div>
    </div>
  );
}
