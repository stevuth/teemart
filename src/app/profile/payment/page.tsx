
"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/back-button";
import { AuthGate } from "@/components/auth-gate";
import { useAuth } from "@/hooks/use-auth";
import { Loader } from "@/components/ui/loader";

const PaymentDetailsForm = dynamic(() => import('@/components/payment-details-form'), {
  ssr: false,
  loading: () => (
    <div className="max-w-md mx-auto space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
    </div>
  )
});

export default function PaymentDetailsPage() {
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
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <BackButton />
                <div className="mt-4 text-left sm:text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Payment Details</h1>
                    <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage the bank account where you receive payouts for your sales.</p>
                </div>
            </div>
            <PaymentDetailsForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
