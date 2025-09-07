
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { verifyTransactionAction } from '@/app/actions/paystack';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';

function VerificationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { clearCart } = useCart();
    
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [error, setError] = useState<string | null>(null);
    const [hasVerified, setHasVerified] = useState(false);

    useEffect(() => {
        if (hasVerified) return;

        const reference = searchParams.get('reference');
        console.log("[Client] Verification page loaded. Reference:", reference);
        
        if (!reference) {
            console.error("[Client] No payment reference found in URL.");
            setError("No payment reference found. Your transaction cannot be verified.");
            setStatus('failed');
            setHasVerified(true);
            return;
        }

        async function verify() {
            setHasVerified(true);
            console.log("[Client] Calling verifyTransactionAction with reference:", reference);
            const result = await verifyTransactionAction(reference!);
            console.log("[Client] Result from verifyTransactionAction:", result);
            
            if (result.success) {
                setStatus('success');
            } else {
                setError(result.error || "An unknown verification error occurred.");
                setStatus('failed');
            }
        }
        
        verify();

    }, [searchParams, router, hasVerified]);

    // Use a separate effect to clear the cart only when status becomes 'success'
    useEffect(() => {
        if (status === 'success') {
            clearCart();
        }
    }, [status, clearCart]);


    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                {status === 'verifying' && <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />}
                {status === 'success' && <CheckCircle className="mx-auto h-12 w-12 text-green-500" />}
                {status === 'failed' && <XCircle className="mx-auto h-12 w-12 text-destructive" />}

                <CardTitle className="mt-4 text-2xl">
                    {status === 'verifying' && 'Verifying Your Payment...'}
                    {status === 'success' && 'Order Successful!'}
                    {status === 'failed' && 'Verification Failed'}
                </CardTitle>
                <CardDescription>
                    {status === 'verifying' && 'Please wait while we confirm your transaction. This may take a moment.'}
                    {status === 'success' && 'Your payment was successful and your order has been placed.'}
                    {status === 'failed' && (error || 'We could not verify your payment. Please contact support if the amount was deducted.')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex w-full justify-center gap-4">
                     {status === 'success' && (
                        <Button asChild className="w-full">
                            <Link href="/profile">View My Orders</Link>
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
