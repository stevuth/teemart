
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, MailWarning, ShieldCheck, MapPin, CalendarDays, Star, ChevronRight, MessageSquare, User, Package, Pencil, Trash2, ShoppingBag, Fingerprint, HelpCircle, Banknote, AlertTriangle, RotateCw, LogOut, History, ShoppingCart, Check, RefreshCw, Phone, Home, CheckCheck, CircleDollarSign, MessageCircleWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/product-card';
import type { Product, ReviewWithUser, Transaction } from '@/lib/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteProductDialog } from '@/components/delete-product-dialog';
import { ReviewList } from '@/components/review-list';
import { BackButton } from '@/components/back-button';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { releaseEscrowAction, markAsDeliveredAction } from '@/app/actions/paystack';
import { RaiseDisputeDialog } from '@/components/raise-dispute-dialog';

const VerificationForm = dynamic(() => import('@/components/verification-form').then(mod => mod.VerificationForm), {
    loading: () => <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>,
    ssr: false,
});

const PaymentDetailsForm = dynamic(() => import('@/components/payment-details-form'), {
    loading: () => <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>,
    ssr: false,
});

export default function ProfilePage() {
  const { user, loading: authLoading, profile, supabase, refetchProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeListings, setActiveListings] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState<string | null>(null);
  const [isReleasingPayment, setIsReleasingPayment] = useState<string | null>(null);
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [transactionToConfirm, setTransactionToConfirm] = useState<Transaction | null>(null);
  const [transactionToDispute, setTransactionToDispute] = useState<Transaction | null>(null);

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

      // Fetch reviews received by the user
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`*, user:profiles(id, full_name, avatar_url)`)
        .eq('seller_id', user.id);
      if (reviewsError) console.error("Error fetching reviews:", reviewsError);
      else setReviews((reviewsData as ReviewWithUser[]) || []);
      
      // Fetch Sales and Purchases
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*') 
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (transError) throw transError;
      
      const formattedTransactions = transactions as Transaction[];
      
      setSales(formattedTransactions.filter(t => t.seller_id === user.id));
      setPurchases(formattedTransactions.filter(t => t.buyer_id === user.id));


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
  
  const handleMarkAsDelivered = async (transactionId: string) => {
    setIsConfirmingDelivery(transactionId);
    const result = await markAsDeliveredAction(transactionId);
    if (result.success) {
      toast({ title: "Order Updated", description: "You have marked this order as delivered." });
      fetchUserData(); // Refetch to update status
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsConfirmingDelivery(null);
  };
  
  const handleReleasePayment = async () => {
    if (!transactionToConfirm) return;
    setIsReleasingPayment(transactionToConfirm.id);
    
    const result = await releaseEscrowAction(transactionToConfirm.id);

    if (result.success) {
        toast({ title: "Payment Released!", description: `Payment has been released to ${transactionToConfirm.product_details?.seller_name}.` });
        fetchUserData(); // Refetch all data to update the status
    } else {
        toast({ title: "Action Failed", description: result.error, variant: "destructive" });
    }
    
    setIsReleasingPayment(null);
    setTransactionToConfirm(null);
    setConfirmDialogOpen(false);
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const handleResendVerification = async () => {
    if (user && supabase) {
       const { error } = await supabase.auth.resend({ type: 'signup', email: user.email! });
      if (error) toast({ title: "Error Sending Email", description: error.message, variant: "destructive" });
      else toast({ title: "Verification Email Sent", description: "Please check your inbox (and spam folder) for the verification link." });
    }
  }

  const onListingDeleted = () => {
    setProductToDelete(null);
    fetchUserData();
  }
  
  const onDisputeRaised = () => {
    setTransactionToDispute(null);
    fetchUserData(); // Refetch data to show new "disputed" status
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

  const activityTabs = [
    { value: "active-listings", label: "Active Listings", icon: Package, count: activeListings.length },
    { value: "my-sales", label: "My Sales", icon: ShoppingBag, count: sales.length },
    { value: "my-purchases", label: "My Purchases", icon: History, count: purchases.length },
    { value: "reviews", label: "Reviews Received", icon: Star, count: reviews.length },
  ];

  const settingsTabs = [
    { value: "verification", label: "Verification", icon: ShieldCheck },
    { value: "payment-details", label: "Payment Details", icon: Banknote },
  ];

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

  const PaymentStatusBadge = ({ status }: { status: Transaction['status'] }) => {
    let text;
    let style;
    switch (status) {
        case 'released':
            text = 'Paid';
            style = 'bg-green-100 text-green-800 border-green-300';
            break;
        case 'refunded':
        case 'disputed':
            text = 'On Hold';
            style = 'bg-orange-100 text-orange-800 border-orange-300';
            break;
        default:
            text = 'Held in Escrow';
            style = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    return (
        <div className="flex flex-col items-end">
            <p className="text-xs text-muted-foreground">Payment</p>
            <Badge variant="outline" className={cn("capitalize", style)}>{text}</Badge>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DeleteProductDialog 
          product={productToDelete}
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          onDeleted={onListingDeleted}
      />
       <RaiseDisputeDialog
        transaction={transactionToDispute}
        isOpen={!!transactionToDispute}
        onClose={() => setTransactionToDispute(null)}
        onDisputeRaised={onDisputeRaised}
      />
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm & Release Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you have received "{transactionToConfirm?.product_details?.name}" and it is as described? This action cannot be undone and will release the payment to the seller.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReleasePayment} disabled={isReleasingPayment === transactionToConfirm?.id}>
              {isReleasingPayment === transactionToConfirm?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Release Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton />
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
                </div>
            </div>
        </div>

        <Separator className="my-12" />

        <Tabs defaultValue="active-listings" className="w-full">
          <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-64 flex-shrink-0">
                  <TabsList className="flex flex-col h-auto items-start justify-start p-2 gap-1 bg-transparent">
                      <p className="text-xs font-semibold text-muted-foreground uppercase px-3 py-2">My Activity</p>
                      {activityTabs.map(tab => (
                          <TabsTrigger key={tab.value} value={tab.value} className="w-full justify-start text-base gap-3 px-3 py-2">
                              <tab.icon className="h-5 w-5" />
                              <span>{tab.label}</span>
                              <Badge variant="secondary" className="ml-auto">{tab.count}</Badge>
                          </TabsTrigger>
                      ))}

                      <Separator className="my-2" />

                      <p className="text-xs font-semibold text-muted-foreground uppercase px-3 py-2">Account Settings</p>
                      {settingsTabs.map(tab => (
                          <TabsTrigger key={tab.value} value={tab.value} className="w-full justify-start text-base gap-3 px-3 py-2">
                              <tab.icon className="h-5 w-5" />
                              <span>{tab.label}</span>
                          </TabsTrigger>
                      ))}
                  </TabsList>
              </div>
              <div className="flex-1 min-w-0">
                  <TabsContent value="active-listings" className="mt-0">
                    {loadingData ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(4)].map((_, i) => (<div key={i} className="flex flex-col space-y-3"><Skeleton className="h-[125px] w-full rounded-xl" /><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div></div>))}</div> : 
                     activeListings.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">{activeListings.map(product => <ProductCard key={product.id} product={product} isClickable={false} actions={<><Button asChild size="sm" variant="outline" className="w-full"><Link href={`/product/edit/${product.id}`}><Pencil className="mr-2 h-4 w-4"/>Edit</Link></Button><Button size="sm" variant="destructive" className="w-full" onClick={() => setProductToDelete(product)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button></>}/>)}</div> : 
                     <div className="text-center py-16 border-2 border-dashed rounded-lg"><Package className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-xl font-medium">No active listings</h3><p className="mt-2 text-muted-foreground">You haven't listed any items for sale yet.</p><Button asChild className="mt-6" variant="default"><a href="/sell">List an Item</a></Button></div>}
                  </TabsContent>
                  
                  <TabsContent value="my-sales" className="mt-0">
                      {loadingData ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : sales.length > 0 ? 
                          <div className="space-y-4">
                              {sales.map(t => (
                                  <Card key={t.id}>
                                      <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start">
                                          <div className="w-full sm:w-auto flex items-center gap-4 flex-1">
                                              <Image src={t.product_details?.image[0] || ''} width={80} height={80} alt={t.product_details?.name || ''} className="rounded-md object-cover" />
                                              <div className="flex-1">
                                                  <p className="font-bold">{t.product_details?.name}</p>
                                                  <p className="text-sm text-muted-foreground">Date: {format(new Date(t.created_at), 'PPP')}</p>
                                                  <p className="text-lg font-bold text-primary pt-1">₦{t.product_price.toLocaleString()}</p>
                                              </div>
                                          </div>
                                          <div className="flex flex-col items-end justify-between self-stretch gap-2">
                                              <div className="flex flex-col items-end">
                                                <p className="text-xs text-muted-foreground">Order Status</p>
                                                <TransactionStatusBadge status={t.status} />
                                              </div>
                                              <PaymentStatusBadge status={t.status} />
                                          </div>
                                      </CardContent>
                                      <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-secondary/30">
                                          <div className="text-sm text-muted-foreground space-y-2">
                                               <h4 className="font-semibold text-sm text-foreground">Buyer &amp; Delivery Information</h4>
                                              <div className="flex items-center gap-2">
                                                  <User className="h-4 w-4 text-primary" />
                                                  <span>{t.product_details.buyer_name}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <Phone className="h-4 w-4 text-primary" />
                                                  <span>{t.product_details.customer_phone}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <Home className="h-4 w-4 text-primary" />
                                                  <p>{t.product_details.delivery_address}</p>
                                              </div>
                                          </div>
                                          {t.status === 'pending' && (
                                              <Button onClick={() => handleMarkAsDelivered(t.id)} disabled={isConfirmingDelivery === t.id} size="sm">
                                                  {isConfirmingDelivery === t.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                                  Confirm Delivery
                                              </Button>
                                          )}
                                      </CardFooter>
                                  </Card>
                              ))}
                          </div> 
                          : <div className="text-center py-16 border-2 border-dashed rounded-lg"><ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-xl font-medium">No Sales Yet</h3><p className="mt-2 text-muted-foreground">This section will show orders you've received from buyers.</p></div>}
                  </TabsContent>

                  <TabsContent value="my-purchases" className="mt-0">
                    {loadingData ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : purchases.length > 0 ? <div className="space-y-4">{purchases.map(t => (
                        <Card key={t.id}>
                            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start">
                                <div className="w-full sm:w-auto flex items-center gap-4 flex-1">
                                    <Image src={t.product_details?.image[0] || ''} width={80} height={80} alt={t.product_details?.name || ''} className="rounded-md object-cover" />
                                    <div className="flex-1">
                                        <p className="font-bold">{t.product_details?.name}</p>
                                        <p className="text-sm text-muted-foreground">Seller: {t.product_details.seller_name}</p>
                                        <p className="text-sm text-muted-foreground">Date: {format(new Date(t.created_at), 'PPP')}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 self-stretch justify-between w-full sm:w-auto">
                                    <TransactionStatusBadge status={t.status} />
                                    <p className="text-lg font-bold text-right">₦{t.product_price.toLocaleString()}</p>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 border-t flex flex-wrap items-center justify-end gap-2">
                                {t.status === 'delivered' && (
                                    <Button className="w-full sm:w-auto" size="sm" onClick={() => { setTransactionToConfirm(t); setConfirmDialogOpen(true); }} disabled={isReleasingPayment === t.id}>
                                        {isReleasingPayment === t.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                                        Confirm & Release Payment
                                    </Button>
                                )}
                                {(t.status === 'pending' || t.status === 'delivered') && (
                                    <Button variant="outline" className="w-full sm:w-auto" size="sm" onClick={() => setTransactionToDispute(t)}>
                                        <MessageCircleWarning className="mr-2 h-4 w-4" />
                                        Raise a Dispute
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}</div> : <div className="text-center py-16 border-2 border-dashed rounded-lg"><History className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-xl font-medium">No Purchase History</h3><p className="mt-2 text-muted-foreground">This section will show items you've purchased.</p><Button asChild className="mt-6" variant="default"><Link href="/">Start Shopping</Link></Button></div>}
                  </TabsContent>
                  
                  <TabsContent value="reviews" className="mt-0">
                      {loadingData ? <div className="flex justify-center items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : <ReviewList reviews={reviews} />}
                  </TabsContent>

                  <TabsContent value="verification" className="mt-0">
                      {authLoading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : profile ? <VerificationForm /> : renderProfileError("Verification")}
                  </TabsContent>

                  <TabsContent value="payment-details" className="mt-0">
                      {authLoading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : profile ? <PaymentDetailsForm /> : renderProfileError("Payment Details")}
                  </TabsContent>
              </div>
          </div>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
