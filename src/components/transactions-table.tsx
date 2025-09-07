
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getAllTransactions, type AdminTransaction } from '@/app/admin/actions';
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
import { Loader2, Search, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TransactionStatus, type Transaction } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TransactionStatusBadge = ({ status }: { status: Transaction['status'] }) => {
    const statusStyles: { [key in Transaction['status']]: string } = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        delivered: 'bg-blue-100 text-blue-800 border-blue-300',
        released: 'bg-green-100 text-green-800 border-green-300',
        disputed: 'bg-orange-100 text-orange-800 border-orange-300',
        refunded: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return <Badge variant="outline" className={cn("capitalize", statusStyles[status])}>{status.replace(/_/g, ' ')}</Badge>;
}

export function TransactionsTable() {
    const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { toast } = useToast();

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        const result = await getAllTransactions();
        if (result.success && result.data) {
            setTransactions(result.data);
        } else {
            toast({
                title: "Error",
                description: `Could not fetch transactions: ${result.error}`,
                variant: "destructive"
            });
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => {
                if (statusFilter === 'all') return true;
                return t.status === statusFilter;
            })
            .filter(t => {
                if (!searchTerm) return true;
                const lowerSearch = searchTerm.toLowerCase();
                return (
                    t.product_details?.name.toLowerCase().includes(lowerSearch) ||
                    t.buyer_name.toLowerCase().includes(lowerSearch) ||
                    t.seller_name.toLowerCase().includes(lowerSearch) ||
                    t.paystack_ref.toLowerCase().includes(lowerSearch)
                );
            });
    }, [transactions, searchTerm, statusFilter]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>All Transactions</CardTitle>
                        <CardDescription>A complete log of all sales and purchases on the platform.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, user, ref..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 sm:w-64"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="released">Released</SelectItem>
                                <SelectItem value="disputed">Disputed</SelectItem>
                                <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableCaption>
                            {filteredTransactions.length > 0 ? `Showing ${filteredTransactions.length} transactions.` : 'No transactions match the current filters.'}
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Buyer</TableHead>
                                <TableHead>Seller</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Image 
                                                src={t.product_details.image?.[0] || ''} 
                                                width={40} 
                                                height={40} 
                                                alt={t.product_details.name} 
                                                className="rounded-md object-cover bg-secondary"
                                            />
                                            <div>
                                                <p className="font-medium line-clamp-1">{t.product_details.name}</p>
                                                <Link href={`https://dashboard.paystack.com/#/transactions/${t.paystack_ref}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                                    {t.paystack_ref} <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{t.buyer_name}</div>
                                        <div className="text-xs text-muted-foreground">{t.buyer_email}</div>
                                    </TableCell>
                                     <TableCell>
                                        <div className="font-medium">{t.seller_name}</div>
                                        <div className="text-xs text-muted-foreground">{t.seller_email}</div>
                                    </TableCell>
                                    <TableCell>{format(new Date(t.created_at), 'PPP')}</TableCell>
                                    <TableCell>
                                        <TransactionStatusBadge status={t.status} />
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">₦{t.product_price.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 )}
            </CardContent>
        </Card>
    );
}
