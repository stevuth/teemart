
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import type { Profile } from "@/lib/types";

const formSchema = z.object({
  account_name: z.string().min(2, "Account name is required."),
  account_number: z.string().regex(/^\d{10}$/, "Account number must be 10 digits."),
  bank_name: z.string().min(3, "Bank name is required."),
});

type PaymentFormValues = z.infer<typeof formSchema>;

type PaymentDetailsFormProps = {
    profile: Profile;
}

export function PaymentDetailsForm({ profile }: PaymentDetailsFormProps) {
  const { toast } = useToast();
  const { user, supabase, setProfile } = useAuth();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_name: profile.account_name || "",
      account_number: profile.account_number || "",
      bank_name: profile.bank_name || "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: PaymentFormValues) => {
    if (!user) return;
    try {
        const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update({
                account_name: data.account_name,
                account_number: data.account_number,
                bank_name: data.bank_name,
            })
            .eq('id', user.id)
            .select()
            .single();
        
        if (error) throw error;
        if (!updatedProfile) {
          throw new Error("Failed to update profile. Please check database permissions (RLS).");
        }

        setProfile(updatedProfile);
        toast({ title: "Success", description: "Your payment details have been saved." });

    } catch (error: any) {
        console.error("Failed to save payment details:", error);
        toast({ 
            title: "Error Saving Details", 
            description: error.message || "An unexpected error occurred. Please try again.",
            variant: "destructive" 
        });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Your Payment Details</CardTitle>
            <CardDescription>
                This information is where you will receive payments for your sales. Please ensure it is accurate.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important Security Notice</AlertTitle>
                <AlertDescription>
                   For your security, never share your bank password, PIN, or OTP with anyone. TeeMart will never ask for this information.
                </AlertDescription>
            </Alert>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="account_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Account Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your name as it appears at the bank" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="account_number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Account Number</FormLabel>
                                <FormControl>
                                    <Input type="text" maxLength={10} placeholder="Your 10-digit account number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="bank_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bank Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Access Bank" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Details
                    </Button>
                </form>
            </Form>
        </CardContent>
    </Card>
  );
}
