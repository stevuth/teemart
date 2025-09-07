
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { getAdminDashboardStats, type DashboardStats, getPendingPayouts, type PendingPayout } from '@/app/admin/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp, HandCoins, Landmark, Repeat, Wallet, PiggyBank } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';

const StatCard = ({ title, value, icon: Icon, formatAsCurrency = true, isLoading = false, description }: { title: string, value: number, icon: React.ElementType, formatAsCurrency?: boolean, isLoading?: boolean, description?: string }) => {
    const formattedValue = formatAsCurrency ? `₦${value.toLocaleString()}` : value.toLocaleString();
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{formattedValue}</div>
                        {description && <p className="text-xs text-muted-foreground">{description}</p>}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

const PendingPayoutsTable = () => {
    const [payouts, setPayouts] = useState<PendingPayout[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchPayouts = async () => {
            setLoading(true);
            const result = await getPendingPayouts();
            if (result.success && result.data) {
                setPayouts(result.data);
            } else {
                toast({
                    title: "Error Fetching Payouts",
                    description: `Could not load pending payouts: ${result.error}`,
                    variant: "destructive"
                });
            }
            setLoading(false);
        };
        fetchPayouts();
    }, [toast]);

    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }
    
    if(payouts.length === 0) {
        return null; // Don't render the table if there are no payouts
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Payouts Queue</CardTitle>
                <CardDescription>This is a list of sellers with funds ready to be released.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Seller</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Amount Due</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payouts.map(payout => (
                            <TableRow key={payout.seller_id}>
                                <TableCell className="font-medium">{payout.full_name}</TableCell>
                                <TableCell>{payout.email}</TableCell>
                                <TableCell className="text-right font-semibold">₦{payout.total_payout_due.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}


export function DashboardStats() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchStats = useCallback(async () => {
        setLoading(true);
        const result = await getAdminDashboardStats();
        
        if (result.success && result.data && result.data.length > 0) {
            setStats(result.data[0]);
        } else {
            console.error("Error fetching dashboard stats:", result.error);
            toast({
                title: "Error Fetching Stats",
                description: `Could not load dashboard statistics: ${result.error}`,
                variant: "destructive"
            });
            setStats(null);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);


    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard 
                    title="Gross Transaction Value"
                    value={stats?.gross_transaction_value || 0}
                    icon={TrendingUp}
                    isLoading={loading}
                    description="Total value of all purchases."
                />
                <StatCard 
                    title="Total Commissions"
                    value={stats?.total_commissions || 0}
                    icon={HandCoins}
                    isLoading={loading}
                    description="Total escrow fees earned."
                />
                 <StatCard 
                    title="Total Paid to Sellers"
                    value={stats?.total_paid_to_sellers || 0}
                    icon={Wallet}
                    isLoading={loading}
                    description="Total funds released from escrow."
                />
                <StatCard 
                    title="Pending Payouts"
                    value={stats?.pending_payouts || 0}
                    icon={Landmark}
                    isLoading={loading}
                    description="Funds held for delivered items."
                />
                <StatCard 
                    title="Completed Transactions"
                    value={stats?.total_transactions || 0}
                    icon={Repeat}
                    formatAsCurrency={false}
                    isLoading={loading}
                    description="Number of successful orders."
                />
            </div>
            <PendingPayoutsTable />
        </div>
    );
}
