
"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, Upload, CreditCard, UserCheck, PartyPopper, Camera } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { SelfieCapture } from './selfie-capture';
import { useRouter } from 'next/navigation';
import { initializeTransactionAction } from '@/app/actions/paystack';

type VerificationStatus = 'unverified' | 'paid' | 'submitted' | 'verified';

export function VerificationForm() {
    const { user, profile, refetchProfile, supabase } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const [status, setStatus] = useState<VerificationStatus>('unverified');

    useEffect(() => {
        if (profile?.is_verified) setStatus('verified');
        else if (profile?.nin_image_url && profile?.selfie_image_url) setStatus('submitted');
        else if (profile?.verification_payment_status === 'paid') setStatus('paid');
        else setStatus('unverified');
    }, [profile]);

    const [ninImageFile, setNinImageFile] = useState<File | null>(null);
    const [ninImagePreview, setNinImagePreview] = useState<string | null>(null);
    const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
    
    const [isPaying, setIsPaying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSelfieCapture, setShowSelfieCapture] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNinImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                toast({ title: "Invalid File Type", description: "Please upload a JPG or PNG image.", variant: "destructive" });
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB Limit
                toast({ title: "File Too Large", description: "Image must be smaller than 2MB.", variant: "destructive" });
                return;
            }
            setNinImageFile(file);
            setNinImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handlePayment = async () => {
        if (!user || !user.email) {
            toast({ title: "Error", description: "You must be logged in to proceed.", variant: "destructive" });
            return;
        }

        setIsPaying(true);

        const metadata = {
            user_id: user.id,
            type: 'verification_payment',
        };

        const result = await initializeTransactionAction(user.email, 1000, metadata);

        if (result.success && result.data?.authorization_url) {
            router.push(result.data.authorization_url);
        } else {
            toast({
                title: "Payment Initialization Failed",
                description: result.error || "Could not connect to payment provider.",
                variant: "destructive",
            });
            setIsPaying(false);
        }
    }

    const handleSubmitVerification = async () => {
        if (!user || !ninImageFile || !selfieDataUrl) {
            toast({ title: "Missing Information", description: "Please provide both a NIN image and a selfie.", variant: "destructive"});
            return;
        }
        setIsSubmitting(true);
        
        try {
            // Upload NIN image
            const ninFileName = `${user.id}/${Date.now()}_nin.png`;
            const { data: ninUploadData, error: ninUploadError } = await supabase.storage
                .from('verification-documents')
                .upload(ninFileName, ninImageFile);
            if (ninUploadError) throw ninUploadError;
            const { data: { publicUrl: ninPublicUrl } } = supabase.storage.from('verification-documents').getPublicUrl(ninUploadData.path);

            // Upload Selfie image
            const selfieFileName = `${user.id}/${Date.now()}_selfie.png`;
            const selfieFile = await (await fetch(selfieDataUrl)).blob();
            const { data: selfieUploadData, error: selfieUploadError } = await supabase.storage
                .from('verification-documents')
                .upload(selfieFileName, selfieFile);
            if (selfieUploadError) throw selfieUploadError;
            const { data: { publicUrl: selfiePublicUrl } } = supabase.storage.from('verification-documents').getPublicUrl(selfieUploadData.path);
            
            // Update profile with URLs
            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({ nin_image_url: ninPublicUrl, selfie_image_url: selfiePublicUrl })
                .eq('id', user.id);
            
            if (profileUpdateError) throw profileUpdateError;

            await refetchProfile(); // Refetch to get new image URLs and status
            toast({ title: "Submission Successful", description: "Your documents are under review. This may take up to 24 hours." });

        } catch (error: any) {
            console.error("Submission Error:", error);
            toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (showSelfieCapture) {
        return (
            <SelfieCapture 
                onSelfieTaken={(dataUrl) => {
                    setSelfieDataUrl(dataUrl);
                    setShowSelfieCapture(false);
                }}
                onClose={() => setShowSelfieCapture(false)}
            />
        )
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Identity Verification</CardTitle>
                <CardDescription>
                    {status === 'unverified' && 'A one-time fee of ₦1,000 is required to verify your identity.'}
                    {status === 'paid' && 'Submit your NIN and a selfie to complete verification.'}
                    {status === 'submitted' && 'Your documents have been submitted and are pending review.'}
                    {status === 'verified' && 'Your identity has been successfully verified!'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {status === 'verified' && (
                     <Alert variant="default" className="bg-green-100 border-green-300 text-green-800">
                        <UserCheck className="h-4 w-4 text-green-800" />
                        <AlertTitle>You are Verified!</AlertTitle>
                        <AlertDescription>
                           A verified badge will now appear on your profile, increasing trust with buyers.
                        </AlertDescription>
                    </Alert>
                )}

                {status === 'unverified' && (
                    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                        <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold">One-Time Fee: ₦1,000</h3>
                        <p className="text-muted-foreground mb-6">Complete the payment to proceed with verification.</p>
                        <Button onClick={handlePayment} disabled={isPaying} size="lg">
                            {isPaying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Pay Now
                        </Button>
                    </div>
                )}
                
                {status === 'paid' && (
                    <div className="space-y-6">
                        <Alert variant="default" className="bg-blue-100 border-blue-300 text-blue-800">
                           <PartyPopper className="h-4 w-4 text-blue-800" />
                           <AlertTitle>Payment Successful!</AlertTitle>
                           <AlertDescription>Please submit your documents for review.</AlertDescription>
                        </Alert>
                        
                        <div className="space-y-2">
                            <Label>1. Upload NIN Slip/Card Image</Label>
                             <div 
                                className="relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                            >
                                <input ref={fileInputRef} type="file" accept="image/jpeg, image/png" onChange={handleNinImageChange} className="hidden" disabled={isSubmitting} />
                                {ninImagePreview ? (
                                    <div className="relative h-40 w-full">
                                        <Image src={ninImagePreview} alt="NIN Preview" layout="fill" className="object-contain rounded-md" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Upload className="h-8 w-8" />
                                        <span>Click to upload NIN document</span>
                                        <span className="text-xs">PNG or JPG (max 2MB)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>2. Take a Selfie</Label>
                            <div className="border rounded-lg p-4 flex items-center justify-between">
                                {selfieDataUrl ? (
                                    <div className="flex items-center gap-4">
                                        <Image src={selfieDataUrl} alt="Selfie Preview" width={64} height={64} className="rounded-md" />
                                        <p className="text-green-600 font-medium flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Selfie captured!</p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">A clear selfie is required.</p>
                                )}
                                <Button variant="outline" onClick={() => setShowSelfieCapture(true)} disabled={isSubmitting}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    {selfieDataUrl ? 'Retake Selfie' : 'Open Camera'}
                                </Button>
                            </div>
                        </div>
                        
                        <Button onClick={handleSubmitVerification} disabled={isSubmitting || !ninImageFile || !selfieDataUrl} className="w-full" size="lg">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit for Verification
                        </Button>
                    </div>
                )}

                {status === 'submitted' && (
                     <Alert>
                        <UserCheck className="h-4 w-4" />
                        <AlertTitle>Documents Submitted for Review</AlertTitle>
                        <AlertDescription>
                           Your verification is pending. We will notify you once the review is complete (usually within 24 hours).
                        </AlertDescription>
                    </Alert>
                )}

            </CardContent>
        </Card>
    );
}
