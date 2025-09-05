
"use client";

import { useEffect, useState, useCallback } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { resolveAccountNumberAction, getBankListAction } from '@/actions/paystack';

type Bank = {
  id: number;
  name: string;
  code: string;
};

export default function PaymentDetailsForm() {
  const { profile, refetchProfile, supabase } = useAuth();
  const { toast } = useToast();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  
  const [selectedBankCode, setSelectedBankCode] = useState(profile?.bank_code || '');
  const [accountNumber, setAccountNumber] = useState(profile?.account_number || '');
  const [accountName, setAccountName] = useState(profile?.account_name || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true);
      const result = await getBankListAction();
      if (result.success && result.data) {
        // Filter out duplicates based on the 'code' property
        const uniqueBanks = result.data.filter((bank, index, self) =>
            index === self.findIndex((b) => (
                b.code === bank.code
            ))
        );
        setBanks(uniqueBanks);
      } else {
        toast({
          title: "Error fetching banks",
          description: "Could not load the list of banks. Please refresh.",
          variant: "destructive"
        });
      }
      setLoadingBanks(false);
    };

    fetchBanks();
  }, [toast]);

  useEffect(() => {
    if (profile) {
      setSelectedBankCode(profile.bank_code || '');
      setAccountNumber(profile.account_number || '');
      setAccountName(profile.account_name || '');
    }
  }, [profile]);
  
  const verifyAccount = useCallback(async () => {
    if (accountNumber.length !== 10 || !selectedBankCode) {
      setAccountName('');
      setVerificationError(null);
      return;
    }
    
    setIsVerifying(true);
    setVerificationError(null);

    const result = await resolveAccountNumberAction(accountNumber, selectedBankCode);

    if (result.success && result.data) {
        setAccountName(result.data.account_name);
    } else {
        setAccountName('');
        setVerificationError(result.error || 'Could not verify account name.');
    }
    setIsVerifying(false);
  }, [accountNumber, selectedBankCode]);

  useEffect(() => {
    const handler = setTimeout(() => {
      verifyAccount();
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [accountNumber, selectedBankCode, verifyAccount]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!profile) {
          toast({ title: "Error", description: "You must be logged in to save details.", variant: "destructive" });
          return;
      }
      if (!selectedBankCode || !accountNumber || !accountName) {
          toast({ title: "Missing fields", description: "Please fill in all the details.", variant: "destructive" });
          return;
      }
      
      setIsSaving(true);
      
      try {
          const selectedBank = banks.find(b => b.code === selectedBankCode);
          if (!selectedBank) {
              toast({ title: "Invalid Bank", description: "Please select a valid bank from the list.", variant: "destructive" });
              setIsSaving(false);
              return;
          }

          const { error } = await supabase
            .from('profiles')
            .update({
                bank_name: selectedBank.name,
                account_name: accountName,
                account_number: accountNumber,
                bank_code: selectedBank.code,
                recipient_code: null, // Reset recipient code on detail change
            })
            .eq('id', profile.id);
          
          if (error) {
            throw error;
          }
          
          toast({ title: "Success!", description: `Your payment details have been saved.` });
          await refetchProfile();

      } catch (error: any) {
          console.error("Error saving payment details:", error);
          toast({ title: 'An Error Occurred', description: error.message || "Could not save your details.", variant: 'destructive' });
      } finally {
          setIsSaving(false);
      }
  }

  const hasChanges = profile?.bank_code !== selectedBankCode ||
                     profile?.account_number !== accountNumber ||
                     profile?.account_name !== accountName;

  return (
    <Card>
        <CardHeader>
            <CardTitle>Bank Account Details</CardTitle>
            <CardDescription>
                This is the account where you will receive payments for your sales. Please ensure the details are correct.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                   <Select
                    value={selectedBankCode}
                    onValueChange={(value) => {
                      setSelectedBankCode(value);
                      setAccountName('');
                      setVerificationError(null);
                    }}
                    required
                    disabled={isSaving || loadingBanks}
                    >
                        <SelectTrigger id="bankName">
                            <SelectValue placeholder={loadingBanks ? "Loading banks..." : "Select a bank"} />
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
                    disabled={isSaving}
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
                            required
                            className="bg-secondary/50"
                        />
                        {isVerifying && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                   </div>
                   {verificationError && <p className="text-sm text-destructive mt-2">{verificationError}</p>}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSaving || isVerifying || !accountName || loadingBanks || !hasChanges}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Details'}
              </Button>
            </form>
        </CardContent>
    </Card>
  );
}
