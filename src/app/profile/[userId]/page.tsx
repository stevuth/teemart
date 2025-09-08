
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/product-card';
import { ReviewList } from '@/components/review-list';
import { Loader2, Star, CalendarDays, Package, ShieldCheck, ShoppingCart, MessageSquare, Store } from 'lucide-react';
import type { Product, ReviewWithUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ReviewForm } from '@/components/review-form';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/back-button';
import { StarRatingDisplay } from '@/components/star-rating-display';

type Seller = {
    id: string;
    full_name: string;
    avatar_url: string;
    created_at: string;
    is_verified: boolean;
}

export default function SellerProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;
    const { user: currentUser, supabase } = useAuth();
    const { addToCart } = useCart();
    const { toast } = useToast();

    const [seller, setSeller] = useState<Seller | null>(null);
    const [listings, setListings] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewSubmittedToggle, setReviewSubmittedToggle] = useState(false);
    const [isChatting, setIsChatting] = useState(false);


    const fetchAllData = useCallback(async () => {
        if (!userId || !supabase) return;
        setLoading(true);

        try {
            // Step 1: Fetch seller profile
            const { data: sellerData, error: sellerError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, created_at, is_verified')
                .eq('id', userId)
                .single();

            if (sellerError) {
                console.error("Error fetching seller profile:", JSON.stringify(sellerError, null, 2));
                throw new Error("Could not fetch seller profile.");
            }
            setSeller(sellerData as Seller);

            // Step 2: Fetch seller's listings
            const { data: listingsData, error: listingsError } = await supabase
                .from('products')
                .select('*, seller:profiles!inner(id, full_name, avatar_url, is_verified)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (listingsError) {
                console.error("Error fetching listings data:", JSON.stringify(listingsError, null, 2));
                throw new Error("Could not fetch seller's listings.");
            }
            
            const transformedListings = (listingsData as any[]).map(item => ({
                ...item,
                image: item.image_url || [],
                postedDate: item.created_at,
                deliveryFee: item.delivery_fee,
                seller: item.seller
            })) as Product[];
            setListings(transformedListings);

            // Step 3: Fetch reviews for the seller
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('reviews')
                .select('*, user:profiles(id, full_name, avatar_url)')
                .eq('seller_id', userId)
                .order('created_at', { ascending: false });
            
            if (reviewsError) {
                console.error("Error fetching reviews:", JSON.stringify(reviewsError, null, 2));
                setReviews([]);
            } else {
                setReviews(reviewsData as ReviewWithUser[]);
            }

        } catch (error: any) {
            console.error("An unexpected error occurred:", error.message);
            setSeller(null);
            setListings([]);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }, [userId, reviewSubmittedToggle, supabase]);
    
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);
    
    const getInitials = (name?: string | null) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    const handleAddToCartClick = (e: React.MouseEvent, product: Product) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        addToCart(product);
    };

    const handleReviewSubmitted = () => {
        setReviewSubmittedToggle(prev => !prev);
    };

    const startConversation = async (otherParticipantId: string) => {
        if (!currentUser) {
            toast({ title: "Please log in", description: "You need to be logged in to start a chat.", variant: "destructive" });
            return;
        }
        if (!otherParticipantId) {
            toast({ title: "Error", description: "Recipient ID is missing.", variant: "destructive" });
            return;
        }

        setIsChatting(true);
        try {
            const { data, error } = await supabase.rpc('get_or_create_conversation', {
                p_participant_one_id: currentUser.id,
                p_participant_two_id: otherParticipantId
            });

            if (error) throw error;
            
            router.push(`/messages?conversationId=${data}`);

        } catch (error: any) {
            console.error("Detailed error object when starting conversation:", error);
            console.error("Stringified error for more details:", JSON.stringify(error, null, 2));
            toast({ title: "Error starting conversation", description: "Could not start a conversation. Please try again. Check console for details.", variant: "destructive" });
        } finally {
            setIsChatting(false);
        }
    };


    const averageRating = useMemo(() => {
        if (reviews.length === 0) {
            return null;
        }
        const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (totalRating / reviews.length).toFixed(1);
    }, [reviews]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                     <BackButton className="-ml-4" />
                    <div className="flex flex-col md:flex-row items-start gap-8 mt-8">
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
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <BackButton className="-ml-4" />
                 <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mt-2">
                    <Avatar className="h-20 w-20 md:h-24 md:w-24 border">
                        <AvatarImage src={seller.avatar_url || ''} alt={seller.full_name || ''} className="object-cover" />
                        <AvatarFallback className="text-3xl">{getInitials(seller.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow text-center md:text-left">
                        <h1 className="text-2xl md:text-3xl font-bold">{seller.full_name}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                         {seller.is_verified ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 gap-1 text-xs">
                                <ShieldCheck className="h-3 w-3" /> Verified
                            </Badge>
                        ) : (
                             <Badge variant="outline" className="gap-1 text-sm text-muted-foreground">
                                <ShieldCheck className="h-4 w-4" /> Not Verified
                            </Badge>
                        )}
                        {seller.created_at && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                <span>Member since {format(new Date(seller.created_at), 'MMMM yyyy')}</span>
                            </div>
                        )}
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                         <div className="flex items-center gap-4">
                            {currentUser && currentUser.id !== seller.id && (
                                 <Button onClick={() => startConversation(seller.id)} disabled={isChatting} size="lg">
                                    {isChatting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                                    Chat with Seller
                                </Button>
                            )}
                            {averageRating ? (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                                    <Star className="h-5 w-5 text-primary" />
                                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                                        <span className="font-bold text-lg">{averageRating}</span>
                                        <StarRatingDisplay rating={parseFloat(averageRating)} starClassName="h-4 w-4" />
                                        <span className="whitespace-nowrap text-muted-foreground">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 text-muted-foreground">
                                    <Star className="h-5 w-5" />
                                    <span>No ratings yet</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Separator className="my-8" />

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
                                            <Button size="sm" variant="default" onClick={(e) => handleAddToCartClick(e, product)} className="w-full">
                                                <ShoppingCart className="mr-2 h-4 w-4" />
                                                Add to Cart
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
                                <ReviewList reviews={reviews} />
                                {currentUser && currentUser.id !== seller.id && (
                                    <ReviewForm 
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

    