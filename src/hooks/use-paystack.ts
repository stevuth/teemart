
"use client";

import { useEffect } from 'react';
import { useToast } from './use-toast';

type PaystackConfig = {
  publicKey?: string;
  email: string;
  amount: number;
  metadata?: object;
  onSuccess: (response: any) => void;
  onClose: () => void;
};

declare global {
  interface Window {
    PaystackPop: {
      setup(options: any): {
        openIframe: () => void;
      };
    };
  }
}

export const usePaystack = (config: PaystackConfig) => {
  const { toast } = useToast();
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializePayment = (options?: { metadata?: object }) => {
    if (!publicKey) {
      console.error("Paystack public key is not set. Please check your .env.local file.");
      toast({
        title: "Configuration Error",
        description: "Payment gateway is not configured correctly.",
        variant: "destructive",
      });
      return;
    }

    const paystackOptions = {
      key: publicKey,
      email: config.email,
      amount: config.amount,
      metadata: options?.metadata || config.metadata,
      callback: config.onSuccess,
      onClose: config.onClose,
    };

    if (window.PaystackPop) {
      const handler = window.PaystackPop.setup(paystackOptions);
      handler.openIframe();
    } else {
      console.error("Paystack JS is not loaded yet.");
       toast({
        title: "Initialization Error",
        description: "Could not connect to the payment gateway. Please wait a moment and try again.",
        variant: "destructive",
      });
    }
  };

  return { initializePayment };
};

    