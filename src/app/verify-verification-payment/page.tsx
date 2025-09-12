
"use client";

// This entire page is deprecated and is no longer used.
// The logic has been moved into the /src/components/verification-form.tsx component
// to create a single-page verification experience.

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

function DeprecatedContent() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/profile/verify');
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-bold">Redirecting...</h3>
            <p className="text-muted-foreground">This page is no longer in use. You are being redirected.</p>
        </div>
    );
}


export default function VerifyVerificationPaymentPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow flex items-center justify-center p-4">
                <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin" />}>
                    <DeprecatedContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
