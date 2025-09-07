
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';

function VerificationContent() {
    const searchParams = useSearchParams();
    const { clearCart } = useCart();
    
    const status = searchParams.get('status');
    const error = searchParams.get('error');

    // This effect will run once when the component mounts with a success status.
    useEffect(() => {
        if (status === 'success') {
            clearCart();
        }
    }, [status, clearCart]);

    const isLoading = !status;

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                {isLoading && <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />}
                {status === 'success' && <CheckCircle className="mx-auto h-12 w-12 text-green-500" />}
                {status === 'failed' && <XCircle className="mx-auto h-12 w-12 text-destructive" />}

                <CardTitle className="mt-4 text-2xl">
                    {isLoading && 'Verifying Your Payment...'}
                    {status === 'success' && 'Order Successful!'}
                    {status === 'failed' && 'Verification Failed'}
                </CardTitle>
                <CardDescription>
                    {isLoading && 'Please wait while we confirm your transaction. This may take a moment.'}
                    {status === 'success' && 'Your payment was successful and your order has been placed.'}
                    {status === 'failed' && (error || 'We could not verify your payment. Please contact support if the amount was deducted.')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex w-full justify-center gap-4">
                     {status === 'success' && (
                        <Button asChild className="w-full">
                            <Link href="/profile?tab=purchases">View My Orders</Link>
                        </Button>
                    )}
                     {status === 'failed' && (
                        <Button asChild className="w-full" variant="outline">
                           <Link href="/">Back to Home</Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function VerifyPaymentPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow flex items-center justify-center p-4">
                <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
                    <VerificationContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}

    