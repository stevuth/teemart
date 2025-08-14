
"use client";

import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Upload } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type VerificationStatus = 'unverified' | 'verifying' | 'verified' | 'failed';

export function VerificationForm() {
    const [nin, setNin] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [extractedNin, setExtractedNin] = useState<string | null>(null);
    const [status, setStatus] = useState<VerificationStatus>('unverified');
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleNinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Allow only digits
        if (value.length <= 11) {
            setNin(value);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                toast({ title: "Invalid File Type", description: "Please upload a JPG or PNG image.", variant: "destructive" });
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setStatus('unverified');
            setExtractedNin(null);
        }
    };

    const handleVerification = async () => {
        if (nin.length !== 11) {
            toast({ title: "Invalid NIN", description: "Please enter a valid 11-digit NIN.", variant: "destructive" });
            return;
        }
        if (!imageFile) {
            toast({ title: "No Image", description: "Please upload an image of your NIN slip.", variant: "destructive" });
            return;
        }

        setStatus('verifying');
        setExtractedNin(null);
        setProgress(0);

        const worker = await createWorker('eng', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    setProgress(Math.round(m.progress * 100));
                }
            },
        });
        
        try {
            const { data: { text } } = await worker.recognize(imageFile);
            await worker.terminate();

            const extracted = text.match(/\d{11}/);
            
            if (extracted && extracted[0]) {
                const foundNin = extracted[0];
                setExtractedNin(foundNin);

                if (foundNin === nin) {
                    setStatus('verified');
                    toast({ title: "Verification Successful!", description: "Your NIN has been verified.", className: "bg-green-100 text-green-800 border-green-300" });
                } else {
                    setStatus('failed');
                    toast({ title: "Verification Failed", description: "The NIN in the image does not match the one you entered.", variant: "destructive" });
                }
            } else {
                setStatus('failed');
                setExtractedNin('Not found');
                toast({ title: "OCR Failed", description: "Could not detect an 11-digit NIN in the image. Please try a clearer picture.", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            setStatus('failed');
            toast({ title: "An Error Occurred", description: "Something went wrong during verification. Please try again.", variant: "destructive" });
        }
    };
    
    const resetForm = () => {
        setNin('');
        setImageFile(null);
        setImagePreview(null);
        setExtractedNin(null);
        setStatus('unverified');
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const isVerifying = status === 'verifying';

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Identity Verification</CardTitle>
                <CardDescription>Verify your identity using your National Identification Number (NIN) to increase trust.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {status === 'verified' ? (
                     <Alert variant="default" className="bg-green-100 border-green-300 text-green-800">
                        <CheckCircle className="h-4 w-4 text-green-800" />
                        <AlertTitle>You are Verified!</AlertTitle>
                        <AlertDescription>
                           Your identity has been successfully verified. A verified badge will now appear on your profile.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="nin">NIN Number (11 digits)</Label>
                            <Input
                                id="nin"
                                type="text"
                                value={nin}
                                onChange={handleNinChange}
                                placeholder="Enter your 11-digit NIN"
                                maxLength={11}
                                disabled={isVerifying}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>NIN Slip/Card Image</Label>
                            <div 
                                className={cn(
                                    "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors",
                                    isVerifying && "cursor-not-allowed opacity-50"
                                )}
                                onClick={() => !isVerifying && fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg, image/png"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    disabled={isVerifying}
                                />
                                {imagePreview ? (
                                    <div className="relative h-40 w-full">
                                        <Image src={imagePreview} alt="NIN Preview" layout="fill" className="object-contain rounded-md" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Upload className="h-8 w-8" />
                                        <span>Click to upload or drag & drop</span>
                                        <span className="text-xs">PNG or JPG (max 2MB)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {status === 'failed' && (
                             <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Verification Failed</AlertTitle>
                                <AlertDescription>
                                   Please check your details and try again. If the issue persists, upload a clearer image.
                                </AlertDescription>
                            </Alert>
                        )}

                        {extractedNin && (
                            <div className="text-sm">
                                <strong>NIN found in image:</strong> {extractedNin}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button onClick={handleVerification} disabled={isVerifying || nin.length !== 11 || !imageFile} className="w-full">
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying... ({progress}%)
                                    </>
                                ) : 'Verify Now'}
                            </Button>
                            <Button onClick={resetForm} variant="outline" disabled={isVerifying} className="w-full">
                                Reset
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

