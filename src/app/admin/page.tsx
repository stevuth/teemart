
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, Loader2, Users, UserCheck, ShoppingBag, GalleryHorizontal, AlertCircle, Banknote, MessageCircleWarning, AreaChart, Repeat } from 'lucide-react';
import { VerificationQueue } from '@/components/verification-queue';
import { UserTable } from '@/components/user-table';
import { SellerTable } from '@/components/seller-table';
import { HeroSectionManager } from '@/components/hero-section-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerificationPaymentsTable } from '@/components/verification-payments-table';
import { DisputeTable } from '@/components/dispute-table';
import { DashboardStats } from '@/components/dashboard-stats';
import { TransactionsTable } from '@/components/transactions-table';

type AdminView = 'dashboard' | 'transactions' | 'verification' | 'sellers' | 'users' | 'hero' | 'verification_payments' | 'disputes';

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: AreaChart },
    { id: 'transactions', label: 'All Transactions', icon: Repeat },
    { id: 'verification', label: 'Verification Queue', icon: UserCheck },
    { id: 'sellers', label: 'Sellers & Listings', icon: ShoppingBag },
    { id: 'users', label: 'Registered Users', icon: Users },
    { id: 'disputes', label: 'Disputes', icon: MessageCircleWarning },
    { id: 'hero', label: 'Hero Section', icon: GalleryHorizontal },
    { id: 'verification_payments', label: 'Verification Payments', icon: Banknote },
];

function AdminNav({ activeView, onLinkClick }: { activeView: AdminView, onLinkClick: (view: AdminView) => void }) {
    return (
        <nav className="flex flex-wrap items-center gap-2 border-b bg-muted/40 p-2 sm:p-4">
            {navItems.map(item => (
                <Button
                    key={item.id}
                    variant={activeView === item.id ? 'default' : 'ghost'}
                    className="justify-start gap-3 text-sm sm:text-base flex-grow sm:flex-grow-0"
                    onClick={() => onLinkClick(item.id as AdminView)}
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Button>
            ))}
        </nav>
    );
}

export default function AdminDashboardPage() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const router = useRouter();
  const [activeView, setActiveView] = useState<AdminView>('dashboard');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/admin/login');
      } else if (profile?.role !== 'admin') {
        router.replace('/');
      }
    }
  }, [user, profile, authLoading, router]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (authLoading || !profile || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (profile.role !== 'admin') {
     return (
        <div className="flex h-screen items-center justify-center bg-secondary">
            <Card className="w-full max-w-md text-center p-4 sm:p-8">
                <CardHeader>
                    <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle className="text-2xl mt-4">Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        You do not have permission to view this page. Please contact an administrator if you believe this is an error.
                    </p>
                    <Button asChild className="mt-6">
                        <Link href="/">Go to Homepage</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
     );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardStats />;
      case 'transactions':
        return <TransactionsTable />;
      case 'verification':
        return <VerificationQueue />;
      case 'sellers':
        return <SellerTable />;
      case 'users':
        return <UserTable />;
      case 'hero':
        return <HeroSectionManager />;
      case 'verification_payments':
        return <VerificationPaymentsTable />;
      case 'disputes':
        return <DisputeTable />;
      default:
        return <DashboardStats />;
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <Shield className="h-6 w-6" />
                <span className="">TeeMart Admin</span>
            </Link>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                 <div className="ml-auto flex-1 sm:flex-initial">
                    {/* Future search bar location */}
                 </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={profile.avatar_url || ''} />
                                <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                            </Avatar>
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>Settings</DropdownMenuItem>
                        <DropdownMenuItem disabled>Support</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
        <AdminNav activeView={activeView} onLinkClick={setActiveView} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
            {renderContent()}
        </main>
    </div>
  );
}
