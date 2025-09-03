
"use client";

import { useEffect, useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
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

type Bank = {
  code: string;
  name: string;
};

const initialState = {
  message: '',
  error: false,
};

export default function PaymentDetailsForm() {
  const { profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useFormState(updatePaymentDetailsAction, initialState);

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
    if (state?.message) {
      if (state.error) {
        toast({ title: 'Error', description: state.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success!', description: state.message });
        startTransition(() => {
          refetchProfile();
        });
      }
    }
  }, [state, toast, refetchProfile]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="bankCode">Bank</Label>
           <Select
            name="bankCode"
            defaultValue={profile?.bank_code || ''}
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
            defaultValue={profile?.account_number || ''}
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

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify and Save Details
      </Button>
    </form>
  );
}
