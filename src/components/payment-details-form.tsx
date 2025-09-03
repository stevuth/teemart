
'use client';

import { useEffect, useState } from 'react';
import { getBankListAction } from '@/app/actions/paystack';
import { updatePaymentDetailsAction } from '@/app/actions/profile';
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
  const [isSaving, setIsSaving] = useState(false);

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
    if (profile) {
        setSelectedBankCode(profile.bank_code || '');
        setAccountNumber(profile.account_number || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBankCode || accountNumber.length !== 10) {
        toast({ title: "Invalid Input", description: "Please select a bank and enter a valid 10-digit account number.", variant: "destructive" });
        return;
    }
    
    setIsSaving(true);
    
    const selectedBank = banks.find(b => b.code === selectedBankCode);
    if (!selectedBank) {
        toast({ title: "Error", description: "Selected bank not found.", variant: "destructive" });
        setIsSaving(false);
        return;
    }

    try {
        const result = await updatePaymentDetailsAction({
            bankCode: selectedBankCode,
            accountNumber,
            bankName: selectedBank.name,
        });

        if (result.success) {
            toast({
                title: 'Success!',
                description: result.message,
            });
            await refetchProfile();
        } else {
            throw new Error(result.error);
        }
    } catch (error: any) {
        toast({
            title: "Error Saving Details",
            description: error.message || "An unexpected error occurred.",
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false);
    }
  }

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
      
      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify and Save Details
      </Button>
    </form>
  );
}

export default PaymentDetailsForm;
