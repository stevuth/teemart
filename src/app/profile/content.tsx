

"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MailWarning, ShieldCheck, MapPin, CalendarDays, Star, ChevronRight, MessageSquare, User, Package, Pencil, Trash2, ShoppingBag, Fingerprint, HelpCircle, Banknote, AlertTriangle, RotateCw, LogOut, History, ShoppingCart, Check, RefreshCw, Phone, Home, CheckCheck, CircleDollarSign, MessageCircleWarning, ArrowLeft, Info, List, BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/product-card';
import type { Product, ReviewWithUser, Transaction } from '@/lib/types';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteProductDialog } from '@/components/delete-product-dialog';
import { RaiseDisputeDialog } from '@/components/raise-dispute-dialog';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import Image from 'next/image';
import { releaseEscrowAction, markAsDeliveredAction } from '@/app/actions/paystack';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { StarRatingDisplay } from '@/components/star-rating-display';
import { AppLoader } from '@/components/app-loader';
import { Loader } from '@/components/ui/loader';

const PaymentDetailsForm = dynamic(() => import('@/components/payment-details-form'), {
    loading: () => <div className="flex justify-center p-8"><AppLoader /></div>,
    ssr: false,
});

type ActiveView = 'menu' | 'listings' | 'sales' | 'purchases' | 'reviews';

export function ProfilePageContent() {
  const { user, loading: authLoading, profile, supabase, refetchProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [isChatting, setIsChatting] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Transaction | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Transaction | null>(null);
  
  const initialView = (searchParams.get('view') as ActiveView) || 'menu';
  const [activeView, setActiveView] = useState<ActiveView>(initialView);

  const setView = (view: ActiveView) => {
    setActiveView(view);
    const newParams = new URLSearchParams(window.location.search);
    if (view === 'menu') {
        newParams.delete('view');
    } else {
        newParams.set('view', view);
    }
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    // Use replace to avoid polluting browser history for simple view changes
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
  };


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
    const { success, error } = await markAsDeliveredAction(transactionId);
    if (success) {
      toast({ title: "Order Updated", description: "You have marked this order as delivered." });
      fetchUserData(); // Refetch to update status
      setSelectedSale(prev => prev ? {...prev, status: 'delivered'} : null);
    } else {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
    setIsConfirmingDelivery(null);
  };
  
  const handleReleasePayment = async () => {
    if (!transactionToConfirm) return;
    setIsReleasingPayment(transactionToConfirm.id);
    
    const { success, error } = await releaseEscrowAction(transactionToConfirm.id);

    if (success) {
        toast({ title: "Payment Released!", description: `Payment has been released to ${transactionToConfirm.product_details?.seller_name}.` });
        fetchUserData(); // Refetch all data to update the status
        setSelectedPurchase(null);
    } else {
        toast({ title: "Action Failed", description: error, variant: "destructive" });
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
  
  const startConversation = async (otherParticipantId: string) => {
    if (!user) {
        toast({ title: "Please log in", description: "You need to be logged in to start a chat.", variant: "destructive" });
        return;
    }
    if (!otherParticipantId) {
        toast({ title: "Error", description: "Recipient ID is missing.", variant: "destructive" });
        return;
    }

    setIsChatting(true);
    try {
        const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
            p_participant_one_id: user.id,
            p_participant_two_id: otherParticipantId,
        });

        if (error) {
            throw new Error(error.message);
        }

        if (conversationId) {
            router.push(`/chat/${conversationId}`);
        } else {
            throw new Error("Failed to get a conversation ID.");
        }

    } catch (error: any) {
        console.error("Error starting conversation:", error);
        toast({ 
            title: "Error starting chat", 
            description: "Could not start a conversation. Please try again or contact support.", 
            variant: "destructive" 
        });
    } finally {
        setIsChatting(false);
    }
  };


  if (authLoading) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-grow flex justify-center items-center"><AppLoader /></div>
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

  const renderListings = () => (
    loadingData ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(4)].map((_, i) => (<div key={i} className="flex flex-col space-y-3"><Skeleton className="h-[125px] w-full rounded-xl" /><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div></div>))}</div>
    ) : activeListings.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeListings.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            isClickable={false} 
            actions={
              <>
                <Button asChild size="sm" variant="outline" className="w-full"><Link href={`/product/edit/${product.id}`}><Pencil className="mr-2 h-4 w-4"/>Edit</Link></Button>
                <Button size="sm" variant="destructive" className="w-full" onClick={() => setProductToDelete(product)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
              </>
            }
          />
        ))}
      </div>
    ) : (
      <div className="text-center py-16 border-2 border-dashed rounded-lg"><Package className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-xl font-medium">No active listings</h3><p className="mt-2 text-muted-foreground">You haven't listed any items for sale yet.</p><Button asChild className="mt-6" variant="default"><a href="/sell">List an Item</a></Button></div>
    )
  );

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

  const renderSales = () => (
    loadingData ? <div className="flex justify-center p-8"><AppLoader /></div> : sales.length > 0 ? 
    <div className="space-y-6">
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle className="font-bold">Important Information for Sellers</AlertTitle>
            <AlertDescription>
                Only mark an order as "Delivered" after the buyer has physically received the item. This is a crucial step to ensure payment is released correctly. Use the "Chat with Buyer" button to send delivery updates.
            </AlertDescription>
        </Alert>
        <div className="space-y-4">
            {sales.map(t => (
                <Card key={t.id} className="overflow-hidden">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-4 flex-grow min-w-0">
                            <Image src={t.product_details?.image[0] || ''} width={64} height={64} alt={t.product_details?.name || ''} className="rounded-md object-cover bg-secondary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{t.product_details?.name}</p>
                                <p className="text-sm text-muted-foreground">To: {t.product_details.buyer_name}</p>
                                <p className="text-sm text-muted-foreground">On: {format(new Date(t.created_at), 'PPP')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 self-stretch sm:self-center flex-shrink-0 w-full sm:w-auto justify-between">
                            <div className="flex flex-col items-start gap-1">
                                <TransactionStatusBadge status={t.status} />
                                <p className="font-bold text-lg">₦{t.product_price.toLocaleString()}</p>
                            </div>
                            <Button onClick={() => setSelectedSale(t)} size="sm" variant="outline">
                                View Details
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
    : <div className="text-center py-16 border-2 border-dashed rounded-lg"><ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-xl font-medium">No Sales Yet</h3><p className="mt-2 text-muted-foreground">This section will show orders you've received from buyers.</p></div>
  );
  
  const renderPurchases = () => (
     loadingData ? <div className="flex justify-center p-8"><AppLoader /></div> : purchases.length > 0 ? 
     <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle className="font-bold">Important Information for Buyers</AlertTitle>
          <AlertDescription>
            Only press "Release Payment" after you have received your item and confirmed it is as described. Use the "Chat with Seller" button for updates on delivery. This ensures your payment remains secure with TeeMart escrow.
          </AlertDescription>
        </Alert>
        <div className="space-y-4">
            {purchases.map(t => (
                <Card key={t.id} className="overflow-hidden">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-4 flex-grow min-w-0">
                            <Image src={t.product_details?.image[0] || ''} width={64} height={64} alt={t.product_details?.name || ''} className="rounded-md object-cover bg-secondary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{t.product_details?.name}</p>
                                <p className="text-sm text-muted-foreground">From: {t.product_details.seller_name}</p>
                                <p className="text-sm text-muted-foreground">On: {format(new Date(t.created_at), 'PPP')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 self-stretch sm:self-center flex-shrink-0 w-full sm:w-auto justify-between">
                            <div className="flex flex-col items-start gap-1">
                                <TransactionStatusBadge status={t.status} />
                                <p className="font-bold text-lg">₦{t.product_price.toLocaleString()}</p>
                            </div>
                            <Button onClick={() => setSelectedPurchase(t)} size="sm" variant="outline">
                                View Details
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
     </div>
     : <div className="text-center py-16 border-2 border-dashed rounded-lg"><History className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-xl font-medium">No Purchase History</h3><p className="mt-2 text-muted-foreground">This section will show items you've purchased.</p><Button asChild className="mt-6" variant="default"><Link href="/">Start Shopping</Link></Button></div>
  );
  
    const renderReviews = () => {
        if (loadingData) {
            return <div className="flex justify-center items-center py-16"><AppLoader /></div>;
        }

        if (reviews.length === 0) {
            return (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-medium">No reviews yet</h3>
                    <p className="mt-2 text-muted-foreground">You haven't received any reviews.</p>
                </div>
            );
        }

        return (
            <Accordion type="single" collapsible className="w-full space-y-4">
                {reviews.map((review) => (
                    <AccordionItem value={review.id} key={review.id} className="border-none">
                        <Card>
                             <AccordionTrigger className="p-4 hover:no-underline [&[data-state=open]]:border-b">
                                <div className="flex items-center gap-4 text-left">
                                    <Avatar>
                                        <AvatarImage src={review.user?.avatar_url || undefined} alt={review.user?.full_name || ''} />
                                        <AvatarFallback>{getInitials(review.user?.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <p className="font-semibold">{review.user?.full_name || 'Anonymous'}</p>
                                        <div className="flex items-center gap-2">
                                            <StarRatingDisplay rating={review.rating} starClassName="h-4 w-4" />
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                             <AccordionContent className="p-4 pt-0">
                                <p className="text-muted-foreground pl-14">{review.comment || "No comment provided."}</p>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                ))}
            </Accordion>
        );
    };
  
  const displayName = profile?.full_name || user.user_metadata?.full_name;
  const userAvatar = profile?.avatar_url || user.user_metadata?.avatar_url;
  const creationTime = user.created_at;

  const activityTabs = [
    { value: "listings", label: "My Listings", icon: Package, count: activeListings.length, action: () => setView('listings') },
    { value: "sales", label: "My Sales", icon: ShoppingBag, count: sales.length, action: () => setView('sales') },
    { value: "purchases", label: "My Purchases", icon: History, count: purchases.length, action: () => setView('purchases') },
    { value: "reviews", label: "Reviews", icon: Star, count: reviews.length, action: () => setView('reviews') },
  ];

  const settingsTabs = [
    { value: "verification", label: "Verification", icon: ShieldCheck, action: () => router.push('/profile/verify') },
    { value: "payment", label: "Payment Details", icon: Banknote, action: () => router.push('/profile/payment') },
  ];

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/');
  }

  const contentMap: Record<ActiveView, { title: string; content: JSX.Element; }> = {
    menu: { title: "", content: <></>}, // Should not be rendered
    listings: { title: "My Listings", content: renderListings() },
    sales: { title: "My Sales", content: renderSales() },
    purchases: { title: "My Purchases", content: renderPurchases() },
    reviews: { title: "Reviews Received", content: renderReviews() },
  };

  const renderContent = () => {
    if (activeView === 'menu') {
        return (
            <>
                <BackButton className="-ml-4 mb-4" />
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6">
                    <Avatar className="h-20 w-20 md:h-24 md:w-24 border">
                        <AvatarImage src={userAvatar || ''} alt={displayName || 'User'} className="object-cover" />
                        <AvatarFallback className="text-3xl">{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow text-center md:text-left">
                        <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                        <p className="text-muted-foreground">{profile?.email}</p>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                        {profile?.is_verified && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 gap-1 text-sm">
                            <ShieldCheck className="h-4 w-4" /> Verified
                            </Badge>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            <span>Member since {creationTime ? format(new Date(creationTime), 'MMMM yyyy') : 'N/A'}</span>
                        </div>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button asChild variant="outline">
                           <Link href="/contact"><HelpCircle className="mr-2 h-4 w-4" />Contact Support</Link>
                        </Button>
                         <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                    </div>
                </div>
                <Separator className="my-6" />

                {/* Desktop Menu */}
                <div className="hidden md:grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-bold text-lg mb-4">My Activity</h3>
                        <div className="space-y-2">
                            {activityTabs.map(tab => (
                                <button key={tab.value} onClick={tab.action} className="w-full flex items-center justify-between p-3 text-left rounded-lg bg-secondary/40 hover:bg-secondary/60">
                                    <div className="flex items-center gap-3">
                                        <tab.icon className="h-5 w-5 text-primary" />
                                        <span className="font-medium">{tab.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{tab.count}</Badge>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Account Settings</h3>
                        <div className="space-y-2">
                           {settingsTabs.map(tab => (
                                <button key={tab.value} onClick={tab.action} className="w-full flex items-center justify-between p-3 text-left rounded-lg bg-secondary/40 hover:bg-secondary/60">
                                    <div className="flex items-center gap-3">
                                        <tab.icon className="h-5 w-5 text-primary" />
                                        <span className="font-medium">{tab.label}</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Mobile Menu */}
                <div className="md:hidden space-y-4">
                     <div>
                        <h3 className="font-bold text-lg mb-4">My Activity</h3>
                        <div className="space-y-2">
                            {activityTabs.map(tab => (
                                <button key={tab.value} onClick={tab.action} className="w-full flex items-center justify-between p-3 text-left rounded-lg bg-secondary/40 hover:bg-secondary/60">
                                    <div className="flex items-center gap-3">
                                        <tab.icon className="h-5 w-5 text-primary" />
                                        <span className="font-medium">{tab.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{tab.count}</Badge>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-bold text-lg mb-4">Account Settings</h3>
                        <div className="space-y-2">
                           {settingsTabs.map(tab => (
                                <button key={tab.value} onClick={tab.action} className="w-full flex items-center justify-between p-3 text-left rounded-lg bg-secondary/40 hover:bg-secondary/60">
                                    <div className="flex items-center gap-3">
                                        <tab.icon className="h-5 w-5 text-primary" />
                                        <span className="font-medium">{tab.label}</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        )
    }

    const { title, content } = contentMap[activeView];
    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setView('menu')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Menu
                </Button>
            </div>
             <h2 className="text-2xl font-bold mb-4">{title}</h2>
            {content}
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
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
            <AlertDialogTitle>Release Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you have received "{transactionToConfirm?.product_details?.name}" and it is as described? This action cannot be undone and will release the payment to the seller.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReleasePayment} disabled={isReleasingPayment === transactionToConfirm?.id}>
              {isReleasingPayment === transactionToConfirm?.id && <Loader variant="spinner" className="mr-2" />}
              Yes, Release Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Dialog open={!!selectedSale} onOpenChange={(isOpen) => !isOpen && setSelectedSale(null)}>
        <DialogContent className="sm:max-w-md">
            {selectedSale && (
                <>
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>
                            Order placed on {format(new Date(selectedSale.created_at), 'PPP')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-4">
                             <Image src={selectedSale.product_details?.image[0] || ''} width={64} height={64} alt={selectedSale.product_details?.name || ''} className="rounded-md object-cover bg-secondary flex-shrink-0" />
                            <div>
                                <p className="font-bold">{selectedSale.product_details?.name}</p>
                                <p className="font-bold text-lg">₦{selectedSale.product_price.toLocaleString()}</p>
                                <div className="mt-1">
                                  <TransactionStatusBadge status={selectedSale.status} />
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex flex-col">
                            <h4 className="font-semibold text-sm mb-2">Buyer & Delivery Information</h4>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    <span>{selectedSale.product_details.buyer_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-primary" />
                                    <span>{selectedSale.product_details.customer_phone}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Home className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="break-all">{selectedSale.product_details.delivery_address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                        <Button onClick={() => selectedSale && startConversation(selectedSale.buyer_id)} disabled={isChatting} size="sm" variant="secondary" className="w-full">
                            {isChatting ? <Loader variant="spinner" className="mr-2" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                            Chat with Buyer
                        </Button>
                        {selectedSale.status === 'pending' && (
                            <Button onClick={() => handleMarkAsDelivered(selectedSale.id)} disabled={isConfirmingDelivery === selectedSale.id} size="sm" variant="secondary" className="w-full">
                                {isConfirmingDelivery === selectedSale.id ? <Loader variant="spinner" className="mr-2" /> : <Check className="mr-2 h-4 w-4" />}
                                Confirm Delivery
                            </Button>
                        )}
                         {selectedSale.status === 'delivered' && (
                             <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 w-full justify-center text-center">
                                 Awaiting buyer's confirmation
                            </Badge>
                         )}
                         {selectedSale.status === 'released' && (
                             <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 w-full justify-center text-center">
                                 Payment has been released
                            </Badge>
                         )}
                    </DialogFooter>
                </>
            )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPurchase} onOpenChange={(isOpen) => !isOpen && setSelectedPurchase(null)}>
        <DialogContent className="sm:max-w-md">
            {selectedPurchase && (
                <>
                    <DialogHeader>
                        <DialogTitle>Purchase Details</DialogTitle>
                        <DialogDescription>
                            Order placed on {format(new Date(selectedPurchase.created_at), 'PPP')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                         <div className="flex items-center gap-4">
                             <Image src={selectedPurchase.product_details?.image[0] || ''} width={64} height={64} alt={selectedPurchase.product_details?.name || ''} className="rounded-md object-cover bg-secondary flex-shrink-0" />
                            <div>
                                <p className="font-bold">{selectedPurchase.product_details?.name}</p>
                                <p className="font-bold text-lg">₦{selectedPurchase.product_price.toLocaleString()}</p>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-semibold text-sm mb-2">Seller Information</h4>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                <span>{selectedPurchase.product_details.seller_name}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex-col gap-2">
                        {selectedPurchase.status === 'delivered' && (
                            <Button className="w-full" size="sm" variant="secondary" onClick={() => { setTransactionToConfirm(selectedPurchase); setConfirmDialogOpen(true); }} disabled={isReleasingPayment === selectedPurchase.id}>
                                {isReleasingPayment === selectedPurchase.id ? <Loader variant="spinner" className="mr-2" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                                Release Payment
                            </Button>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button onClick={() => selectedPurchase && startConversation(selectedPurchase.seller_id)} disabled={isChatting} size="sm" variant="secondary" className="flex-grow">
                                {isChatting ? <Loader variant="spinner" className="mr-2" /> : <MessageSquare className="mr-2 h-4 w-4"/>}
                                Chat
                            </Button>
                            {(selectedPurchase.status === 'pending' || selectedPurchase.status === 'delivered') && (
                                <Button variant="secondary" size="sm" onClick={() => setTransactionToDispute(selectedPurchase)} className="flex-grow">
                                    <MessageCircleWarning className="mr-1.5 h-4 w-4 shrink-0" />
                                    Dispute
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </>
            )}
        </DialogContent>
      </Dialog>
      
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
}
