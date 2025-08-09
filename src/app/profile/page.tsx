
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  if (loading || !user) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">My Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-bold">{user.displayName}</h2>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">Account Information</h3>
                        <div className="text-sm text-muted-foreground">
                            <p><strong>User ID:</strong> {user.uid}</p>
                            <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
                            <p><strong>Account Created:</strong> {new Date(user.metadata.creationTime!).toLocaleDateString()}</p>
                            <p><strong>Last Signed In:</strong> {new Date(user.metadata.lastSignInTime!).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <Button variant="destructive" onClick={() => signOut(auth)}>
                        Sign Out
                    </Button>
                </CardContent>
            </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
