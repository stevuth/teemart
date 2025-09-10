
"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/back-button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthGate } from "@/components/auth-gate";
import { useAuth } from "@/hooks/use-auth";
import { Loader } from "@/components/ui/loader";

const VerificationForm = dynamic(() => import('@/components/verification-form').then(mod => mod.VerificationForm), { 
  ssr: false,
  loading: () => (
    <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
    </div>
  )
});

export default function VerificationPage() {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <main className="flex-grow flex items-center justify-center">
                    <Loader />
                </main>
                <Footer />
            </div>
        );
    }
    
    if (!user) {
         return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <AuthGate />
                </main>
                <Footer />
            </div>
        );
    }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <BackButton />
                <div className="mt-4 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Identity Verification</h1>
                    <p className="text-muted-foreground mt-2">Become a trusted seller on TeeMart by verifying your identity.</p>
                </div>
            </div>
            <VerificationForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
