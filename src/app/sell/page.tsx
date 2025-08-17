
"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/back-button";

const SellForm = dynamic(() => import('@/components/sell-form').then(mod => mod.SellForm), { 
  ssr: false,
  loading: () => (
    <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
    </div>
  )
});

export default function SellPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackButton />
        <div className="mt-8">
            <SellForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
