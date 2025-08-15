
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Loader2, Camera, X, RefreshCw } from 'lucide-react';
import { useToast } from './hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type SelfieCaptureProps = {
    onSelfieTaken: (dataUrl: string) => void;
    onClose: () => void;
}

export function SelfieCapture({ onSelfieTaken, onClose }: SelfieCaptureProps) {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const getCameraPermission = useCallback(async () => {
        if (stream) return; // Already have stream

        try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } // Prefer front camera
            });
            setStream(cameraStream);
            setHasCameraPermission(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your browser settings.',
            });
        }
    }, [stream, toast]);

    useEffect(() => {
        getCameraPermission();
        
        // Cleanup function to stop the stream when the component unmounts
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [getCameraPermission, stream]);

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/png');
            setCapturedImage(dataUrl);
        }
    };
    
    const handleConfirm = () => {
        if (capturedImage) {
            onSelfieTaken(capturedImage);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    }
    
    const renderContent = () => {
        if (hasCameraPermission === null) {
            return (
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Requesting camera access...</p>
                </div>
            )
        }

        if (hasCameraPermission === false) {
             return (
                 <Alert variant="destructive" className="m-6">
                    <Camera className="h-4 w-4" />
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        You need to grant camera permission to take a selfie. Please check your browser settings and refresh the page.
                    </AlertDescription>
                </Alert>
             )
        }
        
        return (
            <>
            <CardContent className="p-0 relative aspect-square w-full max-w-md mx-auto bg-black rounded-md overflow-hidden">
                {capturedImage ? (
                     <img src={capturedImage} alt="Captured selfie" className="w-full h-full object-cover" />
                ) : (
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                )}
                <canvas ref={canvasRef} className="hidden" />
            </CardContent>
            <CardFooter className="flex justify-center p-6">
                {capturedImage ? (
                    <div className="flex gap-4">
                        <Button onClick={handleRetake} variant="outline" size="lg">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retake
                        </Button>
                        <Button onClick={handleConfirm} size="lg">
                            Confirm Selfie
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleCapture} size="lg" className="w-20 h-20 rounded-full">
                        <Camera className="h-8 w-8" />
                    </Button>
                )}
            </CardFooter>
            </>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg relative">
                 <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-2 right-2 z-10 rounded-full bg-white/20 hover:bg-white/30 text-white">
                    <X className="h-5 w-5" />
                 </Button>
                <CardHeader>
                    <CardTitle>Take a Selfie</CardTitle>
                </CardHeader>
                {renderContent()}
            </Card>
        </div>
    );
}

