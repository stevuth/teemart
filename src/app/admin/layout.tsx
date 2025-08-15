
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/admin/login');
      } else if (profile?.role !== 'admin') {
        // User is logged in but not an admin, redirect them away
        router.replace('/');
      }
    }
  }, [user, profile, authLoading, router]);

  if (authLoading || !profile) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  // If user is logged in and is an admin, show the admin content
  if (user && profile.role === 'admin') {
    return <>{children}</>;
  }

  // Fallback while redirecting
  return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
}
