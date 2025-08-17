"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <Button variant="ghost" onClick={() => router.back()} className={className}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
  );
}
