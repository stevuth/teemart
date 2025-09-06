
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getDisputes, type DisputeWithRelations } from '@/app/admin/actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import Link from 'next/link';
import { resolveDisputeAction } from '@/app/actions/dispute';

type StatusFilter = 'all' | 'open' | 'resolved';

export function DisputeTable() {
    const [disputes, setDisputes] = useState<DisputeWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<StatusFilter>('open');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchDisputes = useCallback(async () => {
        setLoading(true);
        const result = await getDisputes();

        if (result.success && result.data) {
            setDisputes(result.data);
        } else {
            console.error("Error fetching disputes:", result.error);
            toast({
                title: "Error Fetching Disputes",
                description: `There was an issue loading disputes: ${result.error}`,
                variant: "destructive"
            });
            setDisputes([]);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchDisputes();
    }, [fetchDisputes]);
    
    const filteredDisputes = useMemo(() => {
        if (filter === 'all') return disputes;
        return disputes.filter(d => d.status === filter);
    }, [disputes, filter]);
    
    const handleResolveDispute = async (disputeId: string) => {
        setUpdatingId(disputeId);
        const result = await resolveDisputeAction(disputeId);
        if (result.success) {
            toast({ title: 'Success', description: 'Dispute has been marked as resolved.' });
            fetchDisputes();
        } else {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
        setUpdatingId(null);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <CardTitle>Dispute Management</CardTitle>
                        <CardDescription>Review and resolve buyer-seller disputes.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant={filter === 'open' ? 'default' : 'outline'} onClick={() => setFilter('open')}>Open</Button>
                        <Button size="sm" variant={filter === 'resolved' ? 'default' : 'outline'} onClick={() => setFilter('resolved')}>Resolved</Button>
                        <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableCaption>{filteredDisputes.length > 0 ? `Showing ${filteredDisputes.length} disputes.` : 'No disputes match the current filter.'}</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Buyer</TableHead>
                                <TableHead>Seller</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Issue</TableHead>
                                <TableHead>Date Raised</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDisputes.map(dispute => (
                                <TableRow key={dispute.id} className={dispute.status === 'open' ? 'bg-orange-50' : ''}>
                                    <TableCell>
                                        <div className="font-medium">{dispute.buyer?.full_name || 'N/A'}</div>
                                        <div className="text-xs text-muted-foreground">{dispute.buyer?.email || 'N/A'}</div>
                                    </TableCell>
                                     <TableCell>
                                        <div className="font-medium">{dispute.transaction?.seller?.full_name || 'N/A'}</div>
                                        <div className="text-xs text-muted-foreground">{dispute.transaction?.seller?.email || 'N/A'}</div>
                                    </TableCell>
                                     <TableCell>
                                        <div className="font-medium max-w-xs truncate">{dispute.transaction?.product_details?.name}</div>
                                         <Link href={`https://dashboard.paystack.com/#/transactions/${dispute.transaction?.paystack_ref}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                           View on Paystack <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        <p className="line-clamp-3">{dispute.message}</p>
                                    </TableCell>
                                    <TableCell>{format(new Date(dispute.created_at), 'PPP')}</TableCell>
                                    <TableCell className="text-right">
                                        {dispute.status === 'open' ? (
                                            <Button size="sm" onClick={() => handleResolveDispute(dispute.id)} disabled={updatingId === dispute.id}>
                                                {updatingId === dispute.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                Mark as Resolved
                                            </Button>
                                        ) : (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                {dispute.resolved_at ? `Resolved on ${format(new Date(dispute.resolved_at), 'PPP')}` : 'Resolved'}
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
