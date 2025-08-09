
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Store, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { LoginModal } from './auth/login-modal';
import { SignupModal } from './auth/signup-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


export function Header() {
  const { user } = useAuth();
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setSignupModalOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const openLoginModal = () => {
    setSignupModalOpen(false);
    setLoginModalOpen(true);
  }

  const openSignupModal = () => {
    setLoginModalOpen(false);
    setSignupModalOpen(true);
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  const handleSellClick = () => {
    if (!user) {
      openLoginModal();
    } else {
      // TODO: Navigate to sell page
    }
  }

  return (
    <>
      <header className="bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                <Store className="h-7 w-7" />
                <span className="text-xl font-bold tracking-tight">TeeMart</span>
              </Link>
            </div>
            
            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <Button onClick={handleSellClick}>
                Sell Product
              </Button>
              <Button size="icon" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
              </Button>

              {user ? (
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                       <Avatar>
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                   <Button variant="secondary" onClick={openLoginModal}>Login</Button>
                   <Button onClick={openSignupModal}>Sign Up</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToSignup={openSignupModal}
      />
      <SignupModal 
        isOpen={isSignupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        onSwitchToLogin={openLoginModal}
      />
    </>
  );
}
