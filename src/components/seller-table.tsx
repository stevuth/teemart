
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ChevronDown, ChevronRight, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AdminDeleteProductDialog } from './admin-delete-product-dialog';
import type { Product } from '@/lib/types';
import { Input } from './ui/input';

type ProductInfo = {
    id: string;
    name: string;
    price: number;
    created_at: string;
    image_url: string[]; // This will now be included
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
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const { supabase } = useAuth();

    const fetchSellers = useCallback(async () => {
        if (!supabase) return;
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
    }, [toast, supabase]);

    useEffect(() => {
        fetchSellers();
    }, [fetchSellers]);
    
    const filteredSellers = useMemo(() => {
        if (!searchTerm) {
            return sellers;
        }
        return sellers.filter(seller => 
            seller.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [sellers, searchTerm]);

    const toggleRow = (sellerId: string) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(sellerId)) {
            newExpandedRows.delete(sellerId);
        } else {
            newExpandedRows.add(sellerId);
        }
        setExpandedRows(newExpandedRows);
    };

    const handleDeleteClick = (product: ProductInfo) => {
        // Adapt ProductInfo to the Product type for the dialog
        const productForDialog: Product = {
            id: product.id,
            name: product.name,
            image: product.image_url,
            price: product.price,
            postedDate: product.created_at,
            // Add dummy values for other required fields
            category: 'Cars',
            condition: 'Used',
            location: '',
            city: '',
            description: '',
            user_id: '',
        };
        setProductToDelete(productForDialog);
    };

    const onProductDeleted = () => {
        setProductToDelete(null);
        fetchSellers(); // Refetch the data to show the updated list
    };

    return (
        <>
            <AdminDeleteProductDialog 
                product={productToDelete}
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                onDeleted={onProductDeleted}
            />
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Sellers & Listings ({sellers.length})</CardTitle>
                            <CardDescription>A list of all users who have listed one or more products for sale.</CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 sm:w-64"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableCaption>{filteredSellers.length > 0 ? `Showing ${filteredSellers.length} of ${sellers.length} sellers.` : 'No sellers found.'}</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead style={{ width: '40px' }}></TableHead>
                                    <TableHead>Seller Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Product Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSellers.map((seller) => (
                                    <React.Fragment key={seller.seller_id}>
                                        <TableRow className="cursor-pointer" onClick={() => toggleRow(seller.seller_id)}>
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
                                                                    <TableHead className="text-right">Actions</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {seller.products.map(product => (
                                                                    <TableRow key={product.id}>
                                                                        <TableCell>{product.name}</TableCell>
                                                                        <TableCell>₦{product.price.toLocaleString()}</TableCell>
                                                                        <TableCell>{format(new Date(product.created_at), 'PPP')}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteClick(product)}>
                                                                                <Trash2 className="h-4 w-4" />
                                                                                <span className="sr-only">Delete</span>
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
