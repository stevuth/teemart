
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-client';
import { Loader2, MailWarning, ShieldCheck, MapPin, CalendarDays, Star, ChevronRight, MessageSquare, User, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { orders as staticOrders } from '@/lib/data';
import { ProductCard } from '@/components/product-card';
import type { Order, OrderStatus, Product } from '@/lib/types';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';


export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeListings, setActiveListings] = useState<Product[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<Product[]>([]); // Assuming this logic will be built out
  const [listingsLoading, setListingsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchListings = async () => {
        setListingsLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, image_url, category, location, condition, description, created_at, delivery_fee')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching user's listings:", error.message || error);
          toast({ title: "Error", description: "Could not fetch your listings.", variant: "destructive" });
        } else {
            const transformedData = (data as any[]).map(item => ({
              ...item,
              image: item.image_url || [],
              postedDate: item.created_at,
              deliveryFee: item.delivery_fee,
              price: item.price || 0,
              category: item.category || '',
              location: item.location || '',
              condition: item.condition || 'Used',
              description: item.description || '',
            })) as Product[];
            setActiveListings(transformedData);
        }
        setListingsLoading(false);
      }

      fetchListings();
    }
  }, [user, toast]);
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const handleResendVerification = async () => {
    if (user) {
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
  const loading = authLoading || (user && listingsLoading);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
          <Header />
          <div className="flex-grow flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
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
  
  const enrichedOrders = useMemo(() => {
    // This part will need to be updated to fetch products for orders from DB
    return staticOrders.map(order => {
        return { ...order, product: { name: 'Product Name', image: 'https://placehold.co/80x80' } };
    });
  }, []);

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Canceled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const displayName = user.user_metadata?.full_name;
  const userAvatar = user.user_metadata?.avatar_url;
  const creationTime = user.created_at;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-shrink-0 flex flex-col items-center md:items-start">
                <Avatar className="h-32 w-32 mb-4 border-4 border-background ring-2 ring-primary">
                    <AvatarImage src={userAvatar || ''} alt={displayName || ''} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold">{displayName}</h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                        <p className="text-muted-foreground">TeeMart Seller</p>
                        {user.email_confirmed_at && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
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
                        <span>Member since {creationTime ? new Date(creationTime).getFullYear() : ''}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Star className="h-4 w-4 text-primary" />
                        <span>4.9 (125 reviews)</span>
                    </div>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                     <Button variant="outline" className="w-full sm:w-auto">
                        <MessageSquare className="mr-2 h-4 w-4"/>
                        Messages
                    </Button>
                    <Button variant="destructive" onClick={() => supabase.auth.signOut()} className="w-full sm:w-auto">
                      Sign Out
                    </Button>
                </div>
            </div>
        </div>

        <Separator className="my-12" />

        <div>
            <Tabs defaultValue="active-listings">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                    <TabsTrigger value="active-listings">Active Listings</TabsTrigger>
                    <TabsTrigger value="my-orders">My Orders</TabsTrigger>
                    <TabsTrigger value="purchase-history">Purchase History</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="active-listings" className="mt-6">
                    {listingsLoading ? (
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
                        {activeListings.map(product => <ProductCard key={product.id} product={product} />)}
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
                    <div className="space-y-4">
                        {enrichedOrders.map(order => (
                            <div key={order.id} className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                                <div className="flex items-center gap-4">
                                    <Image src={order.product!.image} alt={order.product!.name} width={80} height={80} className="rounded-md object-cover" />
                                    <div>
                                        <p className="font-semibold text-lg">{order.product!.name}</p>
                                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span>{order.buyerName}</span>
                                            </div>
                                             <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4" />
                                                <span>Ordered on: {format(parseISO(order.orderDate), 'PPP')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn("text-base", getStatusBadgeClass(order.status))}>
                                    {order.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="purchase-history" className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Placeholder */}
                    </div>
                    <Button variant="link" className="mt-4">View all purchases <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-6">
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">User Reviews (3)</h3>
                        <div className="p-4 rounded-lg border">
                            <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src="https://github.com/random-user1.png" />
                                    <AvatarFallback>BU</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">Buyer One</p>
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">2 weeks ago</p>
                            </div>
                            <p className="mt-3 text-muted-foreground">"Great seller! The iPhone was exactly as described. Fast shipping and excellent communication. Highly recommended."</p>
                        </div>
                        <div className="p-4 rounded-lg border">
                            <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src="https://github.com/random-user2.png" />
                                    <AvatarFallback>ST</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">Seller Two</p>
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                                    </div>
                                 </div>
                            </div>
                            <p className="text-sm text-muted-foreground">1 month ago</p>
                            </div>
                            <p className="mt-3 text-muted-foreground">"Smooth transaction. The buyer was decisive and paid promptly. A pleasure to deal with."</p>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>

      </main>
      <Footer />
    </div>
  );
}
