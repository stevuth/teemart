
"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type VerificationPayment = {
  id: string;
  user_id: string;
  amount: number;
  paystack_ref: string;
  created_at: string;
  profile: {
    full_name: string;
    email: string;
  } | null;
};

export function VerificationPaymentsTable() {
  const [payments, setPayments] = useState<VerificationPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { supabase } = useAuth();

  const fetchPayments = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    // Fetch payments and join with profiles table to get user info
    const { data, error } = await supabase
      .from('verification_payments')
      .select(`
        *,
        profile:profiles(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching verification payments:", error);
      toast({
        title: "Error",
        description: "Could not fetch payment records.",
        variant: "destructive"
      });
      setPayments([]);
    } else {
      // Supabase typescript generator would be great here. We cast for now.
      const typedData = data.map(item => ({
        ...item,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
      })) as VerificationPayment[];
      setPayments(typedData);
    }
    setLoading(false);
  }, [toast, supabase]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalRevenue = useMemo(() => {
    return payments.reduce((acc, payment) => acc + payment.amount, 0);
  }, [payments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Payments</CardTitle>
        <CardDescription>A log of all successful identity verification payments.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <Table>
            <TableCaption>{payments.length > 0 ? `A total of ${payments.length} payments have been made.` : 'No payments have been made yet.'}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Paystack Ref</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.profile?.full_name || 'N/A'}</TableCell>
                  <TableCell>{payment.profile?.email || 'N/A'}</TableCell>
                  <TableCell>{payment.paystack_ref}</TableCell>
                  <TableCell>{format(new Date(payment.created_at), 'PPP p')}</TableCell>
                  <TableCell className="text-right">₦{payment.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
       <CardFooter className="justify-end">
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
            </div>
      </CardFooter>
    </Card>
  );
}
