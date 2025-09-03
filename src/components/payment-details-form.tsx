
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
import { nigerianBanks } from '@/lib/banks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

export default function PaymentDetailsForm() {
  const { profile, refetchProfile, supabase } = useAuth();
  const { toast } = useToast();
  
  const [bankName, setBankName] = useState(profile?.bank_name || '');
  const [accountNumber, setAccountNumber] = useState(profile?.account_number || '');
  const [accountName, setAccountName] = useState(profile?.account_name || '');
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setBankName(profile.bank_name || '');
      setAccountNumber(profile.account_number || '');
      setAccountName(profile.account_name || '');
    }
  }, [profile]);
  
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
                recipient_code: null,
            })
            .eq('id', profile.id);
          
          if (error) {
            throw error; // This will be caught by the catch block
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
                    onValueChange={setBankName}
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
                   <Input
                        id="accountName"
                        name="accountName"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Enter your full account name"
                        required
                        disabled={isSaving}
                    />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Details'}
              </Button>
            </form>
        </CardContent>
    </Card>
  );
}
