
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { verifyVerificationFeeTransaction } from '@/app/actions/paystack';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

function VerificationContent() {
    const searchParams = useSearchParams();
    const { refetchProfile } = useAuth();
    
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const reference = searchParams.get('trxref') || searchParams.get('reference');
        
        if (!reference) {
            setError("No payment reference found. Your session might have expired.");
            setStatus('failed');
            return;
        }

        async function verify() {
            const result = await verifyVerificationFeeTransaction(reference!);
            if (result.success) {
                setStatus('success');
                // Refetch profile to update verification status UI immediately
                await refetchProfile();
            } else {
                setError(result.error || "An unknown verification error occurred.");
                setStatus('failed');
            }
        }
        
        verify();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


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
                    {status === 'success' && 'Your payment for identity verification has been confirmed. Please proceed to your profile to complete the next steps.'}
                    {status === 'failed' && (error || 'We could not verify your payment. Please try again or contact support.')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex w-full justify-center gap-4">
                     {status === 'success' && (
                        <Button asChild className="w-full">
                            <Link href="/profile?view=verification">Continue Verification</Link>
                        </Button>
                    )}
                     {status === 'failed' && (
                        <Button asChild className="w-full" variant="outline">
                           <Link href="/profile">Back to Profile</Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


export default function VerifyVerificationPaymentPage() {
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
