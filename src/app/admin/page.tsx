
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, Loader2, Users, UserCheck, ShoppingBag, GalleryHorizontal, Mail } from 'lucide-react';
import { VerificationQueue } from '@/components/verification-queue';
import { UserTable } from '@/components/user-table';
import { SellerTable } from '@/components/seller-table';
import { HeroSectionManager } from '@/components/hero-section-manager';
import { ContactMessagesTable } from '@/components/contact-messages-table';

type AdminView = 'verification' | 'sellers' | 'users' | 'hero' | 'messages';

export default function AdminDashboardPage() {
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const router = useRouter();
  const [activeView, setActiveView] = useState<AdminView>('verification');

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
     return <div className="flex h-screen items-center justify-center"><p>Access Denied.</p></div>;
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
      case 'messages':
        return <ContactMessagesTable />;
      default:
        return <VerificationQueue />;
    }
  };

  const navItems = [
    { id: 'verification', label: 'Verification Queue', icon: UserCheck },
    { id: 'sellers', label: 'Sellers & Listings', icon: ShoppingBag },
    { id: 'users', label: 'Registered Users', icon: Users },
    { id: 'messages', label: 'Contact Messages', icon: Mail },
    { id: 'hero', label: 'Hero Section', icon: GalleryHorizontal },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <div className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <Shield className="h-6 w-6" />
          <span>TeeMart Admin</span>
        </div>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial text-right">
             <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="icon">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-secondary/30 p-4">
          <nav className="flex flex-col gap-2">
            {navItems.map(item => (
                <Button
                    key={item.id}
                    variant={activeView === item.id ? 'default' : 'ghost'}
                    className="justify-start gap-3"
                    onClick={() => setActiveView(item.id as AdminView)}
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Button>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
            {renderContent()}
        </main>
      </div>
    </div>
  );
}
