
"use client";

import Image from 'next/image';
import { cn } from '@/lib/utils';

export function AppLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
        <div className="relative h-20 w-20">
            <Image 
                src="/logo.png" 
                alt="TeeMart Logo" 
                fill 
                className="animate-pulse"
            />
        </div>
        <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}
