
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/product-card';
import { ReviewList } from '@/components/review-list';
import { Loader2, Star, MapPin, CalendarDays, Package, ShieldCheck, ShoppingCart } from 'lucide-react';
import type { Product, Review, ReviewWithUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ReviewForm } from '@/components/review-form';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';

type Seller = {
    id: string;
    full_name: string;
    avatar_url: string;
    created_at: string;
}

type Profile = {
    id: string;
    full_name: string;
    avatar_url: string;
}

export default function SellerProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const { user: currentUser } = useAuth();
    const { addToCart } = useCart();

    const [seller, setSeller] = useState<Seller | null>(null);
    const [listings, setListings] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewSubmittedToggle, setReviewSubmittedToggle] = useState(false);

    const fetchAllData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);

        try {
            // Fetch seller info and listings concurrently
            const [sellerRes, listingsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', userId).single(),
                supabase.from('products').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            ]);

            if (sellerRes.error || !sellerRes.data) throw sellerRes.error || new Error('User not found');
            
            setSeller(sellerRes.data as Seller);

            if (listingsRes.error) throw listingsRes.error;

            const transformedListings = (listingsRes.data as any[]).map(item => ({
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

            // Step 1: Fetch reviews for the seller's products
            const productIds = transformedListings.map(p => p.id);
            if (productIds.length > 0) {
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('*')
                    .in('product_id', productIds);
                
                if (reviewsError) {
                    // Log error but don't show toast
                    console.error("Error fetching reviews:", reviewsError);
                    setReviews([]);
                } else {
                    const reviewerIds = [...new Set(reviewsData.map(r => r.user_id))];
                    
                    // Step 2: Fetch profiles for the reviewers
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url')
                        .in('id', reviewerIds);

                    if (profilesError) {
                        console.error("Error fetching reviewer profiles:", profilesError);
                        // We can still show reviews, just without user info
                        setReviews(reviewsData.map(r => ({ ...r, user: null })));
                    } else {
                        const profilesMap = new Map(profilesData.map(p => [p.id, p]));
                        const enrichedReviews = reviewsData.map(review => ({
                            ...review,
                            user: profilesMap.get(review.user_id) || null
                        })) as ReviewWithUser[];
                        setReviews(enrichedReviews);
                    }
                }
            } else {
                setReviews([]);
            }

        } catch (error: any) {
            console.error("Error fetching seller data:", error.message);
        } finally {
            setLoading(false);
        }
    }, [userId, reviewSubmittedToggle]);
    
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);
    
    const getInitials = (name?: string | null) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    const handleBuyClick = (e: React.MouseEvent, product: Product) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        addToCart(product);
    };

    const handleReviewSubmitted = () => {
        setReviewSubmittedToggle(prev => !prev);
    };

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
                                <span>{reviews.length > 0 ? `${reviews.length} reviews` : 'No reviews yet'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="my-12" />

                <div>
                    <Tabs defaultValue="listings">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="listings">Seller's Listings ({listings.length})</TabsTrigger>
                            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="listings" className="mt-6">
                            {listings.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {listings.map(product => (
                                      <ProductCard 
                                        key={product.id} 
                                        product={product} 
                                        actions={
                                            <Button size="sm" variant="default" onClick={(e) => handleBuyClick(e, product)} className="w-full">
                                                <ShoppingCart className="mr-2 h-4 w-4" />
                                                Buy
                                            </Button>
                                        }
                                      />
                                    ))}
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
                             <div className="space-y-8">
                                <ReviewList reviews={reviews} listings={listings} />
                                {currentUser && currentUser.id !== seller.id && listings.length > 0 && (
                                    <ReviewForm 
                                        listings={listings}
                                        sellerId={seller.id}
                                        onReviewSubmitted={handleReviewSubmitted} 
                                    />
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
            <Footer />
        </div>
    );
}
