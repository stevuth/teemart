
'use client';

import { useEffect, useState } from 'react';
import { getBankListAction, resolveBankAccount } from '@/app/actions/paystack';
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
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { revalidatePath } from 'next/cache';

type Bank = {
  code: string;
  name: string;
};

export function PaymentDetailsForm() {
  const { profile, refetchProfile } = useAuth();
  const { toast } = useToast();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState(profile?.bank_code || '');
  const [accountNumber, setAccountNumber] = useState(profile?.account_number || '');
  const [accountName, setAccountName] = useState(profile?.account_name || '');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBanks() {
      const result = await getBankListAction();
      if (result.success && result.data) {
        setBanks(result.data);
      }
    }
    fetchBanks();
  }, []);

  useEffect(() => {
    // If there are existing details, assume they are verified.
    if (profile?.account_name && profile?.account_number && profile?.bank_code) {
      setIsVerified(true);
    }
  }, [profile]);
  
  const handleVerifyAccount = async () => {
    if (accountNumber.length !== 10 || !selectedBankCode) return;
    
    setIsVerifying(true);
    setVerificationError(null);
    const result = await resolveBankAccount(accountNumber, selectedBankCode);
    if (result.success) {
      setAccountName(result.data.account_name);
      setIsVerified(true);
    } else {
      setVerificationError(result.error || "Could not verify account.");
      setAccountName('');
      setIsVerified(false);
    }
    setIsVerifying(false);
  };
  
  useEffect(() => {
    setVerificationError(null);
    setIsVerified(false);
    setAccountName(''); // Clear account name on change
    
    if (accountNumber.length === 10 && selectedBankCode) {
        const handler = setTimeout(() => {
            handleVerifyAccount();
        }, 500); // Debounce API call

        return () => clearTimeout(handler);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountNumber, selectedBankCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const selectedBankName = banks.find(b => b.code === selectedBankCode)?.name || profile?.bank_name;

    try {
        const response = await fetch('/api/profile/bank-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bankCode: selectedBankCode,
                accountNumber,
                accountName,
                bankName: selectedBankName
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Request failed with status ${response.status}`);
        }

        toast({
            title: 'Success!',
            description: result.message,
        });
        
        await refetchProfile();

    } catch (error: any) {
         console.error("--- DETAILED SAVE ERROR ---");
         console.error("Timestamp:", new Date().toISOString());
         console.error("Error Name:", error.name);
         console.error("Error Message:", error.message);
         console.error("Full Error Object:", error);
         console.error("---------------------------");

        toast({
            title: "Error Saving Details",
            description: error.message || "An unexpected error occurred.",
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false);
    }
  }

  const selectedBankName = banks.find(b => b.code === selectedBankCode)?.name || profile?.bank_name;

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
                value={accountName}
                readOnly
                placeholder="Account name will appear here"
                className="bg-secondary"
              />
              {isVerifying && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
           </div>
           {verificationError && <p className="text-sm text-destructive mt-1">{verificationError}</p>}
           {isVerified && !isVerifying && <p className="text-sm text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Account verified</p>}
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isSaving || !isVerified}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Details
      </Button>
    </form>
  );
}
