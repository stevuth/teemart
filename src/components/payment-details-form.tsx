
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
import { nigerianBanks } from '@/lib/banks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { resolveAccountNumberAction } from '@/app/actions/paystack';

export default function PaymentDetailsForm() {
  const { profile, refetchProfile, supabase } = useAuth();
  const { toast } = useToast();
  
  const [bankName, setBankName] = useState(profile?.bank_name || '');
  const [accountNumber, setAccountNumber] = useState(profile?.account_number || '');
  const [accountName, setAccountName] = useState(profile?.account_name || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setBankName(profile.bank_name || '');
      setAccountNumber(profile.account_number || '');
      setAccountName(profile.account_name || '');
    }
  }, [profile]);
  
  const verifyAccount = useCallback(async () => {
    if (accountNumber.length !== 10 || !bankName) {
      setAccountName('');
      setVerificationError(null);
      return;
    }
    
    setIsVerifying(true);
    setVerificationError(null);

    const selectedBank = nigerianBanks.find(b => b.name === bankName);
    if (!selectedBank) return;

    const result = await resolveAccountNumberAction(accountNumber, selectedBank.code);

    if (result.success && result.data) {
        setAccountName(result.data.account_name);
    } else {
        setAccountName('');
        setVerificationError(result.error || 'Could not verify account name.');
    }
    setIsVerifying(false);
  }, [accountNumber, bankName]);

  useEffect(() => {
    const handler = setTimeout(() => {
      verifyAccount();
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [accountNumber, bankName, verifyAccount]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!profile) {
          toast({ title: "Error", description: "You must be logged in to save details.", variant: "destructive" });
          return;
      }
      if (!bankName || !accountNumber || !accountName) {
          toast({ title: "Missing fields", description: "Please fill in all the details.", variant: "destructive" });
          return;
      }
      
      setIsSaving(true);
      
      try {
          const selectedBank = nigerianBanks.find(b => b.name === bankName);
          if (!selectedBank) {
              toast({ title: "Invalid Bank", description: "Please select a valid bank from the list.", variant: "destructive" });
              setIsSaving(false);
              return;
          }

          const { error } = await supabase
            .from('profiles')
            .update({
                bank_name: bankName,
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
                    name="bankName"
                    value={bankName}
                    onValueChange={(value) => {
                      setBankName(value);
                      setAccountName('');
                      setVerificationError(null);
                    }}
                    required
                    disabled={isSaving}
                    >
                        <SelectTrigger id="bankName">
                            <SelectValue placeholder={"Select a bank"} />
                        </SelectTrigger>
                        <SelectContent>
                            {nigerianBanks.map((bank) => (
                            <SelectItem key={bank.code} value={bank.name}>
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

              <Button type="submit" className="w-full" disabled={isSaving || isVerifying || !accountName}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Details'}
              </Button>
            </form>
        </CardContent>
    </Card>
  );
}
