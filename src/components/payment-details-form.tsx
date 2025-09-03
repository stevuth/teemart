
"use client";

import { useActionState, useEffect, useState } from 'react';
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
import type { FormState } from '@/app/actions/profile';

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

  const initialState: FormState = { message: null, errors: {} };
  const [state, formAction, pending] = useActionState(updatePaymentDetailsAction, initialState);

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
  
  useEffect(() => {
    if (state?.message) {
      if (Object.keys(state.errors ?? {}).length > 0) {
        toast({
          title: "Error Saving Details",
          description: state.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success!',
          description: state.message,
        });
        refetchProfile();
      }
    }
  }, [state, toast, refetchProfile]);


  return (
    <form action={formAction} className="space-y-6">
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
            {state?.errors?.bankCode && <p className="text-sm font-medium text-destructive">{state.errors.bankCode}</p>}
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
           {state?.errors?.accountNumber && <p className="text-sm font-medium text-destructive">{state.errors.accountNumber}</p>}
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
      
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify and Save Details
      </Button>
    </form>
  );
}
