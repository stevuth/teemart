
"use client";

import { useEffect, useState, useTransition } from 'react';
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
import { getBankListAction } from '@/app/actions/paystack';
import { updatePaymentDetailsAction } from '@/app/actions/profile';
import { useFormState } from 'react-dom';

type Bank = {
  code: string;
  name: string;
};

const initialState = {
  message: '',
  error: false,
};

export default function PaymentDetailsForm() {
  const { user, profile, refetchProfile, supabase } = useAuth();
  const { toast } = useToast();
  
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [accountNumber, setAccountNumber] = useState(profile?.account_number || '');
  const [bankCode, setBankCode] = useState(profile?.bank_code || '');

  // Fetch the list of banks on component mount
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
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!accountNumber || !bankCode) {
          toast({ title: "Missing fields", description: "Please provide an account number and select a bank.", variant: "destructive" });
          return;
      }
      setIsVerifying(true);
      
      try {
          // Step 1: Call our secure API route to verify the account
          const verifyResponse = await fetch('/api/profile/payment-details', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accountNumber, bankCode })
          });

          const verifyResult = await verifyResponse.json();

          if (!verifyResponse.ok) {
              throw new Error(verifyResult.error || 'Verification failed.');
          }

          const { account_name } = verifyResult;
          const selectedBank = banks.find(b => b.code === bankCode);

          // Step 2: On successful verification, create the Paystack recipient and update the profile
          startTransition(async () => {
              const updateResult = await updatePaymentDetailsAction(null, {
                  accountNumber,
                  bankCode,
                  bankName: selectedBank?.name || '',
                  accountName: account_name,
              });

              if (updateResult?.error) {
                  toast({ title: 'Save Failed', description: updateResult.message, variant: 'destructive' });
              } else {
                  toast({ title: 'Success!', description: updateResult.message });
                  await refetchProfile();
              }
          });

      } catch (error: any) {
          toast({ title: 'Verification Error', description: error.message, variant: 'destructive' });
      } finally {
          setIsVerifying(false);
      }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="bankCode">Bank</Label>
           <Select
            name="bankCode"
            value={bankCode}
            onValueChange={setBankCode}
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
                value={profile?.account_name || 'Verified name will appear after saving'}
                readOnly
                className="bg-secondary"
              />
           </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isVerifying || isPending}>
        {(isVerifying || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify and Save Details
      </Button>
    </form>
  );
}
