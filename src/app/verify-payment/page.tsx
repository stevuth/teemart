
"use client";

import { useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyTransactionAction } from '@/app/actions/paystack';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function VerifyPaymentComponent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { clearCart } = useCart();
    
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [message, setMessage] = useState('Verifying your payment, please wait...');

    const verifyPayment = useCallback(async (reference: string, trxref: string) => {
        if (reference !== trxref) {
            setStatus('failed');
            setMessage('Transaction reference mismatch. Please contact support.');
            return;
        }

        const result = await verifyTransactionAction(reference);

        if (result.success) {
            clearCart();
            setStatus('success');
            setMessage('Payment successful! Your transaction has been recorded.');
            toast({
                title: 'Payment Verified',
                description: 'Your order has been placed successfully.',
            });
            setTimeout(() => router.replace('/profile'), 3000);
        } else {
            setStatus('failed');
            setMessage(result.error || 'Payment verification failed. Please contact support if you have been debited.');
             toast({
                title: 'Payment Verification Failed',
                description: result.error || 'Please contact support.',
                variant: 'destructive',
            });
        }
    }, [toast, clearCart, router]);

    useEffect(() => {
        const reference = searchParams.get('reference');
        const trxref = searchParams.get('trxref');

        if (reference && trxref) {
            verifyPayment(reference, trxref);
        } else {
            setStatus('failed');
            setMessage('Invalid payment reference. Could not verify transaction.');
        }
    }, [searchParams, verifyPayment]);

    const statusIcons = {
        verifying: <Loader2 className="h-16 w-16 animate-spin text-primary" />,
        success: <CheckCircle className="h-16 w-16 text-green-500" />,
        failed: <XCircle className="h-16 w-16 text-destructive" />,
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
            <div className="bg-background p-8 rounded-lg shadow-xl text-center max-w-md w-full">
                {statusIcons[status]}
                <h1 className="text-2xl font-bold mt-4">
                    {status === 'verifying' && 'Verifying Payment'}
                    {status === 'success' && 'Payment Successful'}
                    {status === 'failed' && 'Payment Failed'}
                </h1>
                <p className="text-muted-foreground mt-2">{message}</p>
                {status !== 'verifying' && (
                     <button 
                        onClick={() => router.replace('/')}
                        className="mt-6 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        Go to Homepage
                    </button>
                )}
            </div>
        </div>
    );
}

export default function VerifyPaymentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyPaymentComponent />
        </Suspense>
    );
}
