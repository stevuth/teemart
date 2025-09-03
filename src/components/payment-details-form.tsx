
"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
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

type Bank = {
  code: string;
  name: string;
};

const PAYSTACK_PUBLIC_KEY = "pk_test_dcdc77291352593b0249c8bc85c6645a20339f03";

export default function PaymentDetailsForm() {
  const { profile, refetchProfile, supabase } = useAuth();
  const { toast } = useToast();
  
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
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

    if (!supabase || !profile) {
        setApiError("You must be logged in to perform this action.");
        setIsSubmitting(false);
        return;
    }

    if (!accountNumber || !selectedBankCode) {
      setApiError("Please select a bank and enter an account number.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Resolve bank account details with Paystack on the client
      const resolveResponse = await axios.get(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${selectedBankCode}`,
        {
          headers: { Authorization: `Bearer ${PAYSTACK_PUBLIC_KEY}` },
        }
      );
      
      if (!resolveResponse.data.status) {
        throw new Error(resolveResponse.data.message || "Could not verify account details.");
      }
      
      const { account_name } = resolveResponse.data.data;
      const bank_name = banks.find(b => b.code === selectedBankCode)?.name || '';

      // Step 2: Update the profile directly in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          bank_name: bank_name,
          account_name: account_name,
          account_number: accountNumber,
          bank_code: selectedBankCode,
          // recipient_code will be set by a trigger/edge function in a real app
        })
        .eq('id', profile.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Success!',
        description: `Payment details saved for: ${account_name}.`,
      });
      await refetchProfile();

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred.';
      setApiError(errorMessage);
      toast({
        title: "Error Saving Details",
        description: errorMessage,
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
