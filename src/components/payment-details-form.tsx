
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BadgeCheck, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { resolveBankAccount } from "@/app/actions/paystack";
import { updatePaymentDetailsAction } from "@/app/actions/profile";
import axios from 'axios';

type Bank = {
    id: number;
    name: string;
    slug: string;
    code: string;
    longcode: string;
    country: string;
    currency: string;
    type: string;
    active: boolean;
};

const formSchema = z.object({
  bankCode: z.string().min(1, "Please select a bank."),
  accountNumber: z.string().length(10, "Account number must be 10 digits."),
});

type PaymentFormValues = z.infer<typeof formSchema>;

export function PaymentDetailsForm() {
    const { toast } = useToast();
    const { profile, refetchProfile, user } = useAuth();
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resolvedAccount, setResolvedAccount] = useState<{ account_name: string, bank_name: string } | null>(null);

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            bankCode: profile?.bank_code || "",
            accountNumber: profile?.account_number || "",
        },
    });
    
    useEffect(() => {
        if (profile) {
            form.reset({
                bankCode: profile.bank_code || "",
                accountNumber: profile.account_number || "",
            });
            if (profile.account_name && profile.bank_name) {
                 setResolvedAccount({ account_name: profile.account_name, bank_name: profile.bank_name });
            }
        }
    }, [profile, form]);

    useEffect(() => {
        async function fetchBanks() {
            setLoadingBanks(true);
            try {
                const response = await axios.get('/api/paystack/banks');
                if (response.data.success && response.data.data) {
                    setBanks(response.data.data);
                } else {
                     toast({ title: "Error", description: response.data.error || "Could not fetch list of banks.", variant: "destructive" });
                }
            } catch (error) {
                 toast({ title: "Error", description: "Could not fetch list of banks.", variant: "destructive" });
            } finally {
                setLoadingBanks(false);
            }
        }
        fetchBanks();
    }, [toast]);
    
    const watchAccountNumber = form.watch("accountNumber");
    const watchBankCode = form.watch("bankCode");
    
    const handleVerification = useCallback(async () => {
        if (watchAccountNumber.length === 10 && watchBankCode) {
            setIsVerifying(true);
            setResolvedAccount(null);
            const result = await resolveBankAccount(watchAccountNumber, watchBankCode);
            if (result.success && result.data) {
                const selectedBank = banks.find(b => b.code === watchBankCode);
                setResolvedAccount({
                    account_name: result.data.account_name,
                    bank_name: selectedBank?.name || ''
                });
                toast({ title: "Account Verified", description: `Account Name: ${result.data.account_name}`});
            } else {
                 toast({ title: "Verification Failed", description: result.error || "Could not verify account details.", variant: "destructive" });
            }
            setIsVerifying(false);
        }
    }, [watchAccountNumber, watchBankCode, banks, toast]);


    const onSubmit = async () => {
        if (!user) {
            toast({ title: "Authentication Error", description: "You must be logged in to update your profile.", variant: "destructive" });
            return;
        }

        if (!resolvedAccount) {
             toast({ title: "Verification needed", description: "Please verify account details first.", variant: "destructive" });
             return;
        };

        setIsSubmitting(true);
        
        try {
            const result = await updatePaymentDetailsAction({
                bank_name: resolvedAccount.bank_name,
                account_name: resolvedAccount.account_name,
                account_number: watchAccountNumber,
                bank_code: watchBankCode,
            });

            if (result.error) {
                throw new Error(result.error);
            }
            
            toast({ title: "Success", description: "Your payment details have been saved." });
            await refetchProfile();

        } catch (error: any) {
            console.error("Failed to save payment details:", error);
            toast({
                title: "Error Saving Details",
                description: error.message || "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isVerified = !!(profile?.account_name && profile?.bank_name);
    const hasChanged = profile?.account_number !== watchAccountNumber || profile?.bank_code !== watchBankCode;

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Your Payment Details</CardTitle>
                <CardDescription>
                    Verify your bank account with Paystack to receive payments for your sales.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isVerified && !hasChanged && (
                    <Alert variant="default" className="bg-green-100 border-green-200 text-green-800 mb-6">
                        <BadgeCheck className="h-4 w-4 !text-green-800" />
                        <AlertTitle>Your account is verified!</AlertTitle>
                        <AlertDescription>
                            Payments will be sent to: <strong>{profile.account_name}</strong> - {profile.bank_name} ({profile.account_number})
                        </AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form className="space-y-6">
                        <FormField
                            control={form.control}
                            name="bankCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bank</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger disabled={loadingBanks || isVerifying}>
                                                <SelectValue placeholder={loadingBanks ? "Loading banks..." : "Select your bank"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {banks.map((bank, index) => (
                                                <SelectItem key={`${bank.code}-${index}`} value={bank.code}>{bank.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="accountNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account Number</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                             <Input type="text" maxLength={10} placeholder="Your 10-digit account number" {...field} />
                                             <Button 
                                                type="button"
                                                size="sm"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
                                                onClick={handleVerification}
                                                disabled={isVerifying || field.value.length !== 10 || !watchBankCode}
                                             >
                                                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                                Verify
                                             </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        {resolvedAccount && hasChanged && (
                            <Alert variant="default" className="bg-blue-100 border-blue-200 text-blue-800">
                                <ShieldCheck className="h-4 w-4 !text-blue-800" />
                                <AlertTitle>Account Ready to Save</AlertTitle>
                                <AlertDescription>
                                    Verified Account Name: <strong>{resolvedAccount.account_name}</strong>
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        <Button 
                            type="button" 
                            onClick={onSubmit} 
                            disabled={isSubmitting || !resolvedAccount || !hasChanged}
                            className="w-full"
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isVerified && !hasChanged ? 'Account Saved' : 'Save Account Details'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
