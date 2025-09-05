
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, Loader2, Users, UserCheck, ShoppingBag, GalleryHorizontal, AlertCircle, PanelLeft, Banknote } from 'lucide-react';
import { VerificationQueue } from '@/components/verification-queue';
import { UserTable } from '@/components/user-table';
import { SellerTable } from '@/components/seller-table';
import { HeroSectionManager } from '@/components/hero-section-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { VerificationPaymentsTable } from '@/components/verification-payments-table';


type AdminView = 'verification' | 'sellers' | 'users' | 'hero' | 'verification_payments';

const navItems = [
    { id: 'verification', label: 'Verification Queue', icon: UserCheck },
    { id: 'sellers', label: 'Sellers & Listings', icon: ShoppingBag },
    { id: 'users', label: 'Registered Users', icon: Users },
    { id: 'hero', label: 'Hero Section', icon: GalleryHorizontal },
    { id: 'verification_payments', label: 'Verification Payments', icon: Banknote },
];

function NavContent({ activeView, onLinkClick }: { activeView: AdminView, onLinkClick: (view: AdminView) => void }) {
    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-2">
            {navItems.map(item => (
                <Button
                    key={item.id}
                    variant={activeView === item.id ? 'default' : 'ghost'}
                    className="justify-start gap-3"
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
  const [activeView, setActiveView] = useState<AdminView>('verification');
  const [isSheetOpen, setSheetOpen] = useState(false);

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
      default:
        return <VerificationQueue />;
    }
  };
  
  const handleNavLinkClick = (view: AdminView) => {
    setActiveView(view);
    setSheetOpen(false); // Close sheet on navigation
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
       <aside className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <Shield className="h-6 w-6" />
                        <span className="">TeeMart Admin</span>
                    </Link>
                </div>
                <div className="flex-1">
                    <NavContent activeView={activeView} onLinkClick={handleNavLinkClick} />
                </div>
            </div>
        </aside>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                    >
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                     <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/" className="flex items-center gap-2 font-semibold">
                            <Shield className="h-6 w-6" />
                            <span className="">TeeMart Admin</span>
                        </Link>
                    </div>
                    <NavContent activeView={activeView} onLinkClick={handleNavLinkClick} />
                </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
                {/* Can add a search bar here in the future */}
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
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
            {renderContent()}
        </main>
      </div>
    </div>
  );
}
