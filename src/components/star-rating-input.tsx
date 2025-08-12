
"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
  className?: string;
  starClassName?: string;
};

export function StarRatingInput({
  value,
  onChange,
  maxRating = 5,
  className,
  starClassName,
}: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      onMouseLeave={() => setHoverRating(0)}
    >
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={starValue}
            className={cn(
              "h-6 w-6 cursor-pointer transition-colors",
              (hoverRating || value) >= starValue
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300',
              starClassName
            )}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
          />
        );
      })}
    </div>
  );
}
