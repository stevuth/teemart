
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import LoginPage from '@/components/login-page';
import AdminDashboard from '@/components/admin-dashboard';

export default function Home() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <AdminDashboard user={user} />;
  }

  return <LoginPage />;
}
