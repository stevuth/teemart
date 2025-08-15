
"use client";

import { supabase } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import { Button } from './ui/button';
import { LogOut, Shield } from 'lucide-react';
import VerificationQueue from './verification-queue';

type AdminDashboardProps = {
  user: User;
};

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <a href="#" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <Shield className="h-6 w-6" />
            <span>TeeMart Admin</span>
          </a>
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
             <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="icon">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:gap-8">
          <VerificationQueue />
        </div>
      </main>
    </div>
  );
}
