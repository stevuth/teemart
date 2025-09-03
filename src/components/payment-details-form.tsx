
"use client";

import { useEffect, useState } from 'react';
import { getBankListAction, createTransferRecipientAction } from '@/app/actions/paystack';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseBrowserClient } from '@/utils/supabase/client';

type Bank = {
  code: string;
  name: string;
};

export default function PaymentDetailsForm() {
  const { profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState(profile?.bank_code || '');
  const [accountNumber, setAccountNumber] = useState(profile?.account_number || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBanks() {
      const result = await getBankListAction();
      if (result.success && result.data) {
        setBanks(result.data);
      } else {
        toast({ title: "Could not load banks", description: result.error, variant: 'destructive' });
      }
    }
    fetchBanks();
  }, [toast]);
  
  useEffect(() => {
    if (profile) {
      setSelectedBankCode(profile.bank_code || '');
      setAccountNumber(profile.account_number || '');
    }
  }, [profile]);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    if (!accountNumber || !selectedBankCode) {
      setApiError("Please select a bank and enter an account number.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/profile/payment-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: accountNumber,
          bankCode: selectedBankCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.');
      }

      toast({
        title: 'Success!',
        description: result.message,
      });
      await refetchProfile();

    } catch (error: any) {
      console.error("--- DETAILED SAVE ERROR ---");
      console.error("Timestamp:", new Date().toISOString());
      console.error("Error Message:", error.message);
      setApiError(error.message);
      toast({
        title: "Error Saving Details",
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="bankCode">Bank</Label>
           <Select
            name="bankCode"
            value={selectedBankCode}
            onValueChange={setSelectedBankCode}
            required
            >
                <SelectTrigger id="bankCode">
                    <SelectValue placeholder="Select a bank" />
                </SelectTrigger>
                <SelectContent>
                    {banks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            name="accountNumber"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            maxLength={10}
            placeholder="Enter 10-digit account number"
            required
          />
        </div>
        <div>
          <Label htmlFor="accountName">Account Name</Label>
           <div className="relative">
              <Input
                id="accountName"
                name="accountName"
                value={profile?.account_name || ''}
                readOnly
                placeholder="Verified name will appear here after saving"
                className="bg-secondary"
              />
           </div>
        </div>
      </div>

      {apiError && <p className="text-sm font-medium text-destructive">{apiError}</p>}
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify and Save Details
      </Button>
    </form>
  );
}
