
"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingDisplayProps = {
  rating: number;
  maxRating?: number;
  className?: string;
  starClassName?: string;
};

export function StarRatingDisplay({ rating, maxRating = 5, className, starClassName }: StarRatingDisplayProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={starValue}
            className={cn(
              "h-5 w-5",
              starValue <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300',
              starClassName
            )}
          />
        );
      })}
    </div>
  );
}

    