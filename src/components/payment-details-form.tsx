
"use client";

import { useEffect, useState } from 'react';
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

export default function PaymentDetailsForm() {
  const { user, profile, refetchProfile, supabase } = useAuth();
  const { toast } = useToast();
  
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accountNumber, setAccountNumber] = useState(profile?.account_number || '');
  const [bankCode, setBankCode] = useState(profile?.bank_code || '');
  const [accountName, setAccountName] = useState(profile?.account_name || '');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  
  // Update local state when profile changes
  useEffect(() => {
    if (profile) {
      setAccountNumber(profile.account_number || '');
      setBankCode(profile.bank_code || '');
      setAccountName(profile.account_name || '');
    }
  }, [profile]);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!accountNumber || !bankCode) {
          toast({ title: "Missing fields", description: "Please provide an account number and select a bank.", variant: "destructive" });
          return;
      }

      if (!user) {
          toast({ title: "Not logged in", description: "You must be logged in to perform this action.", variant: "destructive" });
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

          const verifiedAccountName = verifyResult.account_name;
          const selectedBank = banks.find(b => b.code === bankCode);
          setAccountName(verifiedAccountName);
          toast({ title: "Account Verified!", description: `Name: ${verifiedAccountName}` });

          // Step 2: On successful verification, save details to Supabase
          setIsSaving(true);
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
                bank_name: selectedBank?.name || '',
                account_name: verifiedAccountName,
                account_number: accountNumber,
                bank_code: bankCode,
            })
            .eq('id', user.id);

          if (updateError) {
            throw new Error(`Database update failed: ${updateError.message}`);
          }
          
          toast({ title: "Success!", description: "Your payment details have been saved." });
          await refetchProfile();

      } catch (error: any) {
          toast({ title: 'An Error Occurred', description: error.message, variant: 'destructive' });
      } finally {
          setIsVerifying(false);
          setIsSaving(false);
      }
  }

  const isLoading = isVerifying || isSaving;

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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="accountName">Account Name</Label>
           <div className="relative">
              <Input
                id="accountName"
                name="accountName"
                value={accountName || (isVerifying ? 'Verifying...' : 'Verified name appears after saving')}
                readOnly
                className="bg-secondary"
              />
           </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isVerifying ? 'Verifying Account...' : isSaving ? 'Saving...' : 'Verify and Save Details'}
      </Button>
    </form>
  );
}
