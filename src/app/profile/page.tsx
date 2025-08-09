
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
import { Loader2, MailWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
