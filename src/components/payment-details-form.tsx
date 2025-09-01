
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
import { Loader2, BadgeCheck, Search, ShieldCheck, Edit } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { getBankListAction, resolveBankAccount } from "@/app/actions/paystack";
import { updatePaymentDetailsAction } from "@/app/actions/profile";


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
    const { profile, refetchProfile, loading: authLoading } = useAuth();
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [resolvedAccount, setResolvedAccount] = useState<{ account_name: string, bank_name: string } | null>(null);

    const isVerified = !!(profile?.account_name && profile?.bank_name && profile?.recipient_code);

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            bankCode: "",
            accountNumber: "",
        },
    });
    
     useEffect(() => {
        if (profile?.recipient_code) {
          setIsEditing(false);
          form.reset({
            bankCode: profile.bank_code || "",
            accountNumber: profile.account_number || "",
          });
        } else {
          setIsEditing(true);
        }
    }, [profile, form]);


    useEffect(() => {
        async function fetchBanks() {
            setLoadingBanks(true);
            const result = await getBankListAction();
            if (result.success && result.data) {
                setBanks(result.data);
            } else {
                 toast({ title: "Error", description: result.error || "Could not fetch list of banks.", variant: "destructive" });
            }
            setLoadingBanks(false);
        }
        fetchBanks();
    }, [toast]);
    
    const handleVerification = useCallback(async () => {
        const { accountNumber, bankCode } = form.getValues();
        if (accountNumber.length !== 10 || !bankCode) {
            toast({title: "Info", description: "Please select a bank and enter a 10-digit account number."})
            return;
        };
        
        setIsVerifying(true);
        setResolvedAccount(null);
        const result = await resolveBankAccount(accountNumber, bankCode);
        if (result.success && result.data) {
            const selectedBank = banks.find(b => b.code === bankCode);
            setResolvedAccount({
                account_name: result.data.account_name,
                bank_name: selectedBank?.name || ''
            });
            toast({ title: "Account Verified", description: `Account Name: ${result.data.account_name}`});
        } else {
             toast({ title: "Verification Failed", description: result.error || "Could not verify account details.", variant: "destructive" });
        }
        setIsVerifying(false);
    }, [banks, toast, form]);

    const onSubmit = async (data: PaymentFormValues) => {
        if (!resolvedAccount) {
            toast({ title: "Verification needed", description: "Please verify account details first.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        
        const result = await updatePaymentDetailsAction({
            bank_name: resolvedAccount.bank_name,
            account_name: resolvedAccount.account_name,
            account_number: data.accountNumber,
            bank_code: data.bankCode,
        });

        if (result.success) {
            toast({ title: "Success", description: "Your payment details have been saved." });
            await refetchProfile();
            setIsEditing(false); // Switch to view mode
        } else {
            toast({ title: "Error Saving Details", description: result.error || "An unexpected error occurred.", variant: "destructive" });
        }

        setIsSaving(false);
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setResolvedAccount(null); // Clear previous verification
        form.reset({
            bankCode: profile?.bank_code || "",
            accountNumber: profile?.account_number || "",
        });
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Your Payment Details</CardTitle>
                        <CardDescription>
                            {isVerified && !isEditing 
                                ? "Your verified account for receiving payments." 
                                : "Verify your bank account with Paystack to receive payments for your sales."
                            }
                        </CardDescription>
                    </div>
                    {isVerified && !isEditing && (
                        <Button variant="outline" size="sm" onClick={handleEditClick}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {!isEditing && isVerified ? (
                     <Alert variant="default" className="bg-green-100 border-green-200 text-green-800">
                        <BadgeCheck className="h-4 w-4 !text-green-800" />
                        <AlertTitle>Your account is verified!</AlertTitle>
                        <AlertDescription>
                            Payments will be sent to: <strong>{profile?.account_name}</strong> - {profile?.bank_name} ({profile?.account_number})
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="bankCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bank</FormLabel>
                                        <Select onValueChange={(value) => { field.onChange(value); setResolvedAccount(null); }} defaultValue={field.value} value={field.value} disabled={authLoading || isSaving || isVerifying}>
                                            <FormControl>
                                                <SelectTrigger disabled={loadingBanks || isVerifying || isSaving}>
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
                                                 <Input type="text" maxLength={10} placeholder="Your 10-digit account number" {...field} onChange={(e) => {field.onChange(e); setResolvedAccount(null);}} disabled={authLoading || isSaving} />
                                                 <Button 
                                                    type="button"
                                                    size="sm"
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
                                                    onClick={handleVerification}
                                                    disabled={isVerifying || field.value.length !== 10 || !form.getValues().bankCode || isSaving}
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
                            
                            {resolvedAccount && (
                                <Alert variant="default" className="bg-blue-100 border-blue-200 text-blue-800">
                                    <ShieldCheck className="h-4 w-4 !text-blue-800" />
                                    <AlertTitle>Account Ready to Save</AlertTitle>
                                    <AlertDescription>
                                        Verified Account Name: <strong>{resolvedAccount.account_name}</strong>
                                    </AlertDescription>
                                </Alert>
                            )}
                            
                            <div className="flex gap-2 justify-end">
                                {isEditing && isVerified && (
                                     <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); setResolvedAccount(null); }}>Cancel</Button>
                                )}
                                <Button 
                                    type="submit"
                                    disabled={authLoading || isSaving || !resolvedAccount}
                                >
                                    {(isSaving || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Details
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}
