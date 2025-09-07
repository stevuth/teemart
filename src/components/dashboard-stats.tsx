
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { getAdminDashboardStats, type DashboardStats } from '@/app/admin/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, HandCoins, Landmark, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="Total Sales Volume"
                value={stats?.total_sales_volume || 0}
                icon={TrendingUp}
                isLoading={loading}
                description="Gross value of all completed transactions."
            />
            <StatCard 
                title="Total Commissions"
                value={stats?.total_commissions || 0}
                icon={HandCoins}
                isLoading={loading}
                description="Total escrow fees earned from sales."
            />
            <StatCard 
                title="Completed Transactions"
                value={stats?.total_transactions || 0}
                icon={Repeat}
                formatAsCurrency={false}
                isLoading={loading}
                description="Number of successfully completed orders."
            />
            <StatCard 
                title="Pending Payouts to Sellers"
                value={stats?.pending_payouts || 0}
                icon={Landmark}
                isLoading={loading}
                description="Value of funds held in escrow for delivered items."
            />
        </div>
    );
}
