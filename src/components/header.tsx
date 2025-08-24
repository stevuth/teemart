
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { ShoppingCart, User, LogOut, LayoutDashboard, MessageSquare, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-auth-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { Badge } from './ui/badge';
import { useNotifications } from '@/hooks/use-notifications';
import Image from 'next/image';
import { cn } from '@/lib/utils';


export function Header() {
  const { user, supabase } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { toast } = useToast();
  const { cartCount } = useCart();
  const { notificationCount } = useNotifications();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Logged Out', description: "You have been successfully logged out."})
    router.push('/');
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  const handleSellClick = () => {
    if (!user) {
      openLoginModal();
    } else {
      router.push('/sell');
    }
  }

  const displayName = user?.user_metadata?.full_name;
  const userEmail = user?.email;
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <>
      <header className="bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="https://sdmntprnortheu.oaiusercontent.com/files/00000000-d348-61f4-8ab2-558b04d36155/raw?se=2025-08-24T13%3A34%3A28Z&sp=r&sv=2024-08-04&sr=b&scid=6177b60e-9da9-57d6-b8c4-af11a12f4c03&skoid=f05d6a75-3c59-41ae-be2c-51a75f29841e&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-08-23T19%3A33%3A49Z&ske=2025-08-24T19%3A33%3A49Z&sks=b&skv=2024-08-04&sig=c/rd3NTAg79JiW20JrMxdt1SwvftiE1cPC0t7Habw/o%3D" alt="TeeMart Logo" width={32} height={32} />
              <span className="text-xl font-bold tracking-tight">TeeMart</span>
            </Link>
            
            <div className="flex items-center gap-1">
              <Button onClick={handleSellClick} size="sm" className="hidden sm:inline-flex sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Sell
              </Button>
              <Button onClick={handleSellClick} size="icon" variant="ghost" className="sm:hidden">
                 <PlusCircle className="h-5 w-5" />
              </Button>

              <Button asChild size="icon" variant="ghost" aria-label="Cart">
                <Link href="/cart">
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                        {cartCount}
                      </Badge>
                    )}
                  </div>
                </Link>
              </Button>

               {user && (
                 <Link href="/messages" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")} aria-label="Messages">
                    <MessageSquare className="h-5 w-5" />
                    {notificationCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                        {notificationCount}
                    </Badge>
                    )}
                 </Link>
               )}

              {user ? (
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                       <Avatar>
                        <AvatarImage src={userAvatar || ''} alt={displayName || 'User'} />
                        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {userEmail}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={openLoginModal} size="icon" variant="ghost" aria-label="Profile">
                    <User className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
