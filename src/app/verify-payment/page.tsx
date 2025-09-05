
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { verifyTransactionAction } from '@/app/actions/paystack';
import { useCart } from '@/hooks/use-cart';
import Link from 'next/link';

function VerificationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { clearCart } = useCart();
    
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const reference = searchParams.get('reference');
        
        if (!reference) {
            setError("No payment reference found.");
            setStatus('failed');
            return;
        }

        async function verify() {
            const result = await verifyTransactionAction(reference!);
            if (result.success) {
                setStatus('success');
                clearCart();
            } else {
                setError(result.error || "An unknown verification error occurred.");
                setStatus('failed');
            }
        }
        
        verify();

    }, [searchParams, clearCart]);


    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                {status === 'verifying' && <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />}
                {status === 'success' && <CheckCircle className="mx-auto h-12 w-12 text-green-500" />}
                {status === 'failed' && <XCircle className="mx-auto h-12 w-12 text-destructive" />}

                <CardTitle className="mt-4 text-2xl">
                    {status === 'verifying' && 'Verifying Payment...'}
                    {status === 'success' && 'Payment Successful!'}
                    {status === 'failed' && 'Payment Failed'}
                </CardTitle>
                <CardDescription>
                    {status === 'verifying' && 'Please wait while we confirm your transaction. Do not close this page.'}
                    {status === 'success' && 'Your order has been placed. You can view it in your profile.'}
                    {status === 'failed' && (error || 'We could not verify your payment. Please try again or contact support.')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex w-full justify-center gap-4">
                     {status === 'success' && (
                        <Button asChild className="w-full">
                            <Link href="/profile">Go to My Profile</Link>
                        </Button>
                    )}
                     {status === 'failed' && (
                        <Button asChild className="w-full">
                           <Link href="/checkout">Try Again</Link>
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
                <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin" />}>
                    <VerificationContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}

    