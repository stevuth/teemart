
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/product-card';
import { ReviewList } from '@/components/review-list';
import { Loader2, MessageSquare, Star, MapPin, CalendarDays, Package, ShieldCheck } from 'lucide-react';
import type { Product, ReviewWithUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

type Seller = {
    id: string;
    full_name: string;
    avatar_url: string;
    created_at: string;
}

export default function SellerProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const { toast } = useToast();

    const [seller, setSeller] = useState<Seller | null>(null);
    const [listings, setListings] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
    const [loading, setLoading] = useState(true);

    const getInitials = (name?: string | null) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const fetchSellerData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);

        // Fetch seller public info from the new public.users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, user_metadata, created_at')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            console.error("Error fetching seller info:", userError || 'User not found');
            toast({ title: "Error", description: "Could not find seller information.", variant: "destructive" });
            setLoading(false);
            return;
        }
        
        const metadata = userData.user_metadata as any;
        setSeller({
            id: userData.id,
            full_name: metadata?.full_name || 'TeeMart Seller',
            avatar_url: metadata?.avatar_url,
            created_at: userData.created_at,
        });

        // Fetch seller listings
        const { data: listingsData, error: listingsError } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (listingsError) {
            console.error("Error fetching seller listings:", listingsError);
            toast({ title: "Error", description: "Could not fetch seller's listings.", variant: "destructive" });
        } else {
            const transformedListings = (listingsData as any[]).map(item => ({
                ...item,
                image: item.image_url || [],
                postedDate: item.created_at,
                deliveryFee: item.delivery_fee,
                price: item.price || 0,
                category: item.category || '',
                location: item.location || '',
                city: item.city || '',
                condition: item.condition || 'Used',
                description: item.description || '',
            })) as Product[];
            setListings(transformedListings);

            // Fetch reviews for the listings
            if (transformedListings.length > 0) {
                const productIds = transformedListings.map(l => l.id);
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('*, user:users(id, user_metadata)')
                    .in('product_id', productIds)
                    .order('created_at', { ascending: false });
                
                if (reviewsError) {
                    console.error("Error fetching reviews:", reviewsError);
                } else {
                    const transformedReviews = reviewsData.map(review => {
                      const reviewUser = review.user as any; // Cast to any to access properties safely
                      return {
                        ...review,
                        user: reviewUser ? { 
                            user_metadata: { 
                                full_name: reviewUser.user_metadata?.full_name || 'Unknown User',
                                avatar_url: reviewUser.user_metadata?.avatar_url
                            } 
                        } : { user_metadata: { full_name: 'Unknown User' } }
                      }
                    }) as ReviewWithUser[];
                    setReviews(transformedReviews);
                }
            }
        }
        setLoading(false);
    }, [userId, toast]);

    useEffect(() => {
        fetchSellerData();
    }, [fetchSellerData]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <div className="flex flex-col md:flex-row items-start gap-8">
                        <div className="flex-shrink-0 flex flex-col items-center md:items-start">
                            <Skeleton className="h-32 w-32 rounded-full mb-4" />
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32 mt-2" />
                        </div>
                        <div className="flex-grow w-full border-t md:border-t-0 md:border-l md:pl-8 pt-8 md:pt-0">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                            </div>
                            <div className="mt-8 flex gap-3">
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </div>
                    </div>
                    <Separator className="my-12" />
                    <Skeleton className="h-10 w-full" />
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                           <div key={i} className="flex flex-col space-y-3">
                                <Skeleton className="h-[125px] w-full rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow flex items-center justify-center text-center">
                    <div>
                        <h1 className="text-2xl font-bold">Seller Not Found</h1>
                        <p className="text-muted-foreground">The seller you are looking for does not exist.</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex flex-col md:flex-row items-start gap-8">
                    <div className="flex-shrink-0 flex flex-col items-center md:items-start">
                        <Avatar className="h-32 w-32 mb-4 border-4 border-background ring-2 ring-primary">
                            <AvatarImage src={seller.avatar_url || ''} alt={seller.full_name || ''} />
                            <AvatarFallback>{getInitials(seller.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-bold">{seller.full_name}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                <p className="text-muted-foreground">TeeMart Seller</p>
                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex-grow w-full border-t md:border-t-0 md:border-l md:pl-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground pt-8 md:pt-0">
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>Lagos, Nigeria</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                <span>Member since {seller.created_at ? new Date(seller.created_at).getFullYear() : ''}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Star className="h-4 w-4 text-primary" />
                                <span>4.9 (125 reviews)</span>
                            </div>
                        </div>
                        <div className="mt-8 flex flex-col sm:flex-row gap-3">
                             <Button variant="outline" className="w-full sm:w-auto">
                                <MessageSquare className="mr-2 h-4 w-4"/>
                                Chat with Seller
                            </Button>
                        </div>
                    </div>
                </div>

                <Separator className="my-12" />

                <div>
                    <Tabs defaultValue="listings">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="listings">Seller's Listings</TabsTrigger>
                            <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        </TabsList>

                        <TabsContent value="listings" className="mt-6">
                            {listings.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {listings.map(product => <ProductCard key={product.id} product={product} />)}
                                </div>
                            ) : (
                                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                    <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-xl font-medium">No active listings</h3>
                                    <p className="mt-2 text-muted-foreground">This seller has no items for sale right now.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="reviews" className="mt-6">
                            <ReviewList reviews={reviews} listings={listings} />
                            {/* Review submission form would go here */}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
            <Footer />
        </div>
    );
}
 

    