
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, MailWarning, ShieldCheck, MapPin, CalendarDays, Star, MessageSquare, Briefcase, ShoppingBag, History, CreditCard, ChevronRight, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileFeatureCard } from '@/components/profile-feature-card';
import { products } from '@/lib/data';
import { ProductCard } from '@/components/product-card';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const handleResendVerification = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox (and spam folder) for the verification link.",
        });
      } catch (error: any) {
        toast({
          title: "Error Sending Email",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  }

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
          <Header />
          <div className="flex-grow flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
          <Footer />
      </div>
    );
  }
  
  if (!user.emailVerified) {
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

  const activeListings = products.slice(0, 4);
  const soldItems = products.slice(5, 7);
  const purchaseHistory = products.slice(8, 10);

  return (
    <div className="flex flex-col min-h-screen bg-secondary/20">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4 border-4 border-background ring-2 ring-primary">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold">{user.displayName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-muted-foreground">TeeMart Seller</p>
                    {user.emailVerified && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
                  </div>
                </div>

                <Separator className="my-6" />
                
                <div className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>Lagos, Nigeria</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span>Member since {new Date(user.metadata.creationTime!).getFullYear()}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Star className="h-4 w-4 text-primary" />
                        <span>4.9 (125 reviews)</span>
                    </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <ProfileFeatureCard 
                    icon={Briefcase} 
                    label="Active Listings" 
                    value="12" 
                    buttonText="View All" 
                    onButtonClick={() => toast({ title: "Coming soon!"})}
                  />
                  <ProfileFeatureCard 
                    icon={ShoppingBag} 
                    label="Items Sold" 
                    value="88" 
                  />
                   <ProfileFeatureCard 
                    icon={History} 
                    label="Purchase History" 
                    value="32" 
                    buttonText="View All"
                    onButtonClick={() => toast({ title: "Coming soon!"})}
                  />
                </div>
                 
                <Separator className="my-6" />
                
                <Button variant="outline" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4"/>
                    Messages
                </Button>
                <Button variant="destructive" onClick={() => signOut(auth)} className="w-full mt-3">
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </aside>
          
          {/* Main Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active-listings">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                    <TabsTrigger value="active-listings">Active Listings</TabsTrigger>
                    <TabsTrigger value="sold-items">Sold Items</TabsTrigger>
                    <TabsTrigger value="purchase-history">Purchase History</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="active-listings" className="mt-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {activeListings.map(product => <ProductCard key={product.id} product={product} />)}
                     </div>
                     <Button variant="link" className="mt-4">View all active listings <ChevronRight className="h-4 w-4 ml-1" /></Button>
                  </TabsContent>

                  <TabsContent value="sold-items" className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {soldItems.map(product => <ProductCard key={product.id} product={product} />)}
                    </div>
                    <Button variant="link" className="mt-4">View all sold items <ChevronRight className="h-4 w-4 ml-1" /></Button>
                  </TabsContent>

                  <TabsContent value="purchase-history" className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {purchaseHistory.map(product => <ProductCard key={product.id} product={product} />)}
                    </div>
                     <Button variant="link" className="mt-4">View all purchases <ChevronRight className="h-4 w-4 ml-1" /></Button>
                  </TabsContent>
                  
                  <TabsContent value="reviews" className="mt-6">
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">User Reviews (3)</h3>
                        {/* Sample Review */}
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
              </CardContent>
            </Card>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Transaction & Escrow</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active-orders">
                   <TabsList>
                    <TabsTrigger value="active-orders">Active Orders</TabsTrigger>
                    <TabsTrigger value="pending-payments">Pending Payments</TabsTrigger>
                    <TabsTrigger value="order-history">Order History</TabsTrigger>
                  </TabsList>
                  <TabsContent value="active-orders" className="mt-6">
                    <div className="border rounded-lg p-6 text-center">
                      <CreditCard className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                      <p className="font-medium">No Active Orders</p>
                      <p className="text-sm text-muted-foreground">Orders you are currently buying or selling will appear here.</p>
                    </div>
                  </TabsContent>
                   <TabsContent value="pending-payments" className="mt-6">
                     <div className="border rounded-lg p-6 text-center">
                      <CreditCard className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                      <p className="font-medium">No Pending Payments</p>
                      <p className="text-sm text-muted-foreground">Escrow payments awaiting your action will be shown here.</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="order-history" className="mt-6">
                     <div className="border rounded-lg p-6 text-center">
                      <History className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                      <p className="font-medium">No Order History</p>
                      <p className="text-sm text-muted-foreground">Your completed or cancelled orders will be listed here.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
