
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
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
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

type ProductInfo = {
    id: string;
    name: string;
    price: number;
    created_at: string;
};

type SellerWithProducts = {
    seller_id: string;
    full_name: string;
    email: string;
    product_count: number;
    products: ProductInfo[];
};

export function SellerTable() {
    const [sellers, setSellers] = useState<SellerWithProducts[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    useEffect(() => {
        const fetchSellers = async () => {
            setLoading(true);

            const { data, error } = await supabase.rpc('get_sellers_with_products');
            
            if (error) {
                console.error("Error fetching sellers:", error);
                toast({
                    title: "Error",
                    description: "Could not fetch the list of sellers.",
                    variant: "destructive"
                });
                setSellers([]);
            } else {
                setSellers(data as SellerWithProducts[]);
            }
            setLoading(false);
        };

        fetchSellers();
    }, [toast]);

    const toggleRow = (sellerId: string) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(sellerId)) {
            newExpandedRows.delete(sellerId);
        } else {
            newExpandedRows.add(sellerId);
        }
        setExpandedRows(newExpandedRows);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sellers & Listings</CardTitle>
                <CardDescription>A list of all users who have listed one or more products for sale.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableCaption>{sellers.length > 0 ? 'A list of all sellers.' : 'No sellers found.'}</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead style={{ width: '40px' }}></TableHead>
                                <TableHead>Seller Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Product Count</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sellers.map((seller) => (
                                <>
                                    <TableRow key={seller.seller_id} className="cursor-pointer" onClick={() => toggleRow(seller.seller_id)}>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                {expandedRows.has(seller.seller_id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium">{seller.full_name || 'N/A'}</TableCell>
                                        <TableCell>{seller.email}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary">{seller.product_count}</Badge>
                                        </TableCell>
                                    </TableRow>
                                    {expandedRows.has(seller.seller_id) && (
                                        <TableRow>
                                            <TableCell colSpan={4}>
                                                <div className="p-4 bg-secondary/50 rounded-md">
                                                     <h4 className="font-semibold mb-2 text-sm">Products by {seller.full_name}</h4>
                                                      <Table>
                                                          <TableHeader>
                                                              <TableRow>
                                                                  <TableHead>Product Name</TableHead>
                                                                  <TableHead>Price</TableHead>
                                                                  <TableHead>Date Listed</TableHead>
                                                              </TableRow>
                                                          </TableHeader>
                                                          <TableBody>
                                                              {seller.products.map(product => (
                                                                  <TableRow key={product.id}>
                                                                      <TableCell>{product.name}</TableCell>
                                                                      <TableCell>₦{product.price.toLocaleString()}</TableCell>
                                                                      <TableCell>{format(new Date(product.created_at), 'PPP')}</TableCell>
                                                                  </TableRow>
                                                              ))}
                                                          </TableBody>
                                                      </Table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
