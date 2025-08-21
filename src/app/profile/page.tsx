
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MailWarning, ShieldCheck, MapPin, CalendarDays, Star, ChevronRight, MessageSquare, User, Package, Pencil, Trash2, ShoppingBag, Fingerprint, HelpCircle, Banknote, AlertTriangle, RotateCw, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { orders as staticOrders } from '@/lib/data';
import { ProductCard } from '@/components/product-card';
import type { Order, OrderStatus, Product, Review, ReviewWithUser } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteProductDialog } from '@/components/delete-product-dialog';
import { ReviewList } from '@/components/review-list';
import { VerificationForm } from '@/components/verification-form';
import { BackButton } from '@/components/back-button';
import { PaymentDetailsForm } from '@/components/payment-details-form';

export default function ProfilePage() {
  const { user, loading: authLoading, profile, supabase, refetchProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeListings, setActiveListings] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  const fetchUserData = useCallback(async () => {
    if (!user || !supabase) return;
    setLoadingData(true);
    
    try {
      // Fetch listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('products')
        .select('*, seller:profiles(id, full_name, avatar_url, is_verified)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      const transformedData = (listingsData as any[]).map(item => ({
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
        seller: item.seller,
      })) as Product[];
      setActiveListings(transformedData);

      // Fetch reviews for the listings
      const productIds = transformedData.map(p => p.id);
      if (productIds.length > 0) {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            user:profiles (
              id,
              full_name,
              avatar_url
            )
          `)
          .in('product_id', productIds);
          
        if (reviewsError) { 
            console.error("Error fetching reviews:", reviewsError);
            setReviews([]);
        } else {
            setReviews((reviewsData as ReviewWithUser[]) || []);
        }
      } else {
        setReviews([]);
      }

    } catch (error: any) {
        console.error("Error fetching profile data: ", error);
        toast({ title: "Error", description: "Could not fetch your data.", variant: "destructive" });
    } finally {
        setLoadingData(false);
    }
  }, [user, toast, supabase]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (user && supabase) {
      fetchUserData();
    }
  }, [user, authLoading, router, fetchUserData, supabase]);
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const handleResendVerification = async () => {
    if (user && supabase) {
       const { error } = await supabase.auth.resend({
            type: 'signup',
            email: user.email!,
       });
      if (error) {
        toast({
          title: "Error Sending Email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox (and spam folder) for the verification link.",
        });
      }
    }
  }

  const onListingDeleted = () => {
    setProductToDelete(null);
    fetchUserData();
  }

  const renderProfileError = (tabName: string) => (
    <div className="flex justify-center p-8">
      <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Could Not Load {tabName} Details</AlertTitle>
          <AlertDescription className="space-y-3">
              <p>This is likely due to a database permission error. Please run the SQL script found in the README.md file in your Supabase SQL Editor to fix it.</p>
              <Button size="sm" onClick={refetchProfile}><RotateCw className="mr-2 h-4 w-4" />Retry</Button>
          </AlertDescription>
      </Alert>
    </div>
  );

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.refresh();
    toast({ title: 'Logged Out', description: "You have been successfully logged out." });
    router.push('/');
  };

  if (authLoading) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-grow flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
            <Footer />
        </div>
    );
  }
  
   if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto p-4 text-center">
          <p>Redirecting to homepage...</p>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (user && !user.email_confirmed_at) {
    return (
       <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-center">Verify Your Email</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <MailWarning className="h-4 w-4" />
                  <AlertTitle>Email Verification Required</AlertTitle>
                  <AlertDescription>
                    Please check your inbox at <strong>{user.email}</strong> to verify your account. You need to verify your email before you can access your profile.
                  </AlertDescription>
                </Alert>
                <div className="mt-6 text-center text-sm">
                  Didn't receive an email?
                  <Button variant="link" onClick={handleResendVerification} className="p-1 h-auto">
                     Resend verification link
                  </Button>
                </div>
              </CardContent>
            </Card>
        </main>
        <Footer />
       </div>
    )
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name;
  const userAvatar = profile?.avatar_url || user.user_metadata?.avatar_url;
  const creationTime = user.created_at;

  return (
    <>
      <DeleteProductDialog 
          product={productToDelete}
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          onDeleted={onListingDeleted}
      />
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BackButton className="-ml-4" />
          <div className="flex flex-col md:flex-row items-start gap-8 mt-8">
              <div className="flex-shrink-0 flex flex-col items-center md:items-start">
                  <Avatar className="h-32 w-32 mb-4 border-4 border-background ring-2 ring-primary">
                      <AvatarImage src={userAvatar || ''} alt={displayName || ''} />
                      <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center md:text-left">
                      <h1 className="text-3xl font-bold">{displayName}</h1>
                      <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                          <p className="text-muted-foreground">TeeMart Seller</p>
                           {profile?.is_verified && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
                      </div>
                  </div>
              </div>
              <div className="flex-grow w-full border-t md:border-t-0 md:border-l md:pl-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground pt-8 md:pt-0">
                      <div className="flex items-center gap-3">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          <span>Member since {creationTime ? format(new Date(creationTime), 'MMMM yyyy') : ''}</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <Star className="h-4 w-4 text-primary" />
                          <span>{reviews.length > 0 ? `${reviews.length} reviews` : 'No reviews yet'}</span>
                      </div>
                  </div>
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                      <Button asChild variant="outline" className="w-full sm:w-auto">
                          <Link href="/help"><HelpCircle className="mr-2 h-4 w-4"/>Help & Support</Link>
                      </Button>
                      <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                  </div>
              </div>
          </div>

          <Separator className="my-12" />

          <div>
              <Tabs defaultValue="active-listings">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto">
                      <TabsTrigger value="active-listings">Active Listings ({activeListings.length})</TabsTrigger>
                      <TabsTrigger value="my-orders">My Orders</TabsTrigger>
                      <TabsTrigger value="purchase-history">Purchase History</TabsTrigger>
                      <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                      <TabsTrigger value="verification">Verification</TabsTrigger>
                      <TabsTrigger value="payment-details">Payment Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="active-listings" className="mt-6">
                      {loadingData ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                      ) : activeListings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {activeListings.map(product => 
                            <ProductCard 
                                key={product.id} 
                                product={product}
                                isClickable={false}
                                actions={
                                    <>
                                        <Button asChild size="sm" variant="outline" className="w-full">
                                            <Link href={`/product/edit/${product.id}`}><Pencil className="mr-2 h-4 w-4"/>Edit</Link>
                                        </Button>
                                        <Button size="sm" variant="destructive" className="w-full" onClick={() => setProductToDelete(product)}>
                                            <Trash2 className="mr-2 h-4 w-4"/>Delete
                                        </Button>
                                    </>
                                }
                            />
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-xl font-medium">No active listings</h3>
                          <p className="mt-2 text-muted-foreground">You haven't listed any items for sale yet.</p>
                          <Button asChild className="mt-6" variant="default">
                              <a href="/sell">List an Item</a>
                          </Button>
                        </div>
                      )}
                  </TabsContent>
                  
                  <TabsContent value="my-orders" className="mt-6">
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-medium">No Orders Yet</h3>
                        <p className="mt-2 text-muted-foreground">This section will show orders you've received from buyers.</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="purchase-history" className="mt-6">
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-medium">No Purchase History</h3>
                        <p className="mt-2 text-muted-foreground">This section will show items you've purchased.</p>
                        <Button asChild className="mt-6" variant="default">
                            <Link href="/">Start Shopping</Link>
                        </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="reviews" className="mt-6">
                      {loadingData ? (
                          <div className="flex justify-center items-center py-16">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                      ) : (
                          <ReviewList reviews={reviews} listings={activeListings} />
                      )}
                  </TabsContent>

                   <TabsContent value="verification" className="mt-6">
                      {authLoading ? (
                          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                      ) : profile ? (
                          <VerificationForm />
                      ) : (
                          renderProfileError("Verification")
                      )}
                  </TabsContent>

                  <TabsContent value="payment-details" className="mt-6">
                    {authLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : profile ? (
                        <PaymentDetailsForm />
                    ) : (
                        renderProfileError("Payment Details")
                    )}
                  </TabsContent>
              </Tabs>
          </div>

        </main>
        <Footer />
      </div>
    </>
  );
}
