
"use client";

import { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client'; // Import the pre-configured client
import { Skeleton } from '@/components/ui/skeleton';
import type { Profile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  supabase: SupabaseClient;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  setProfile: () => {},
  supabase: supabase, // Use the imported client
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const getSessionAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        const currentUser = session?.user;
        setUser(currentUser ?? null);

        if (currentUser) {
            if (currentUser.banned_until && new Date(currentUser.banned_until) > new Date()) {
                await supabase.auth.signOut();
                toast({ title: "Access Denied", description: "This account has been banned.", variant: "destructive" });
                setUser(null);
                setSession(null);
                setProfile(null);
            } else {
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();
                
                if (error) console.error("Error fetching profile:", error);
                else setProfile(profileData);
            }
        }
      } catch (error: any) {
        console.error("Configuration error:", error.message)
      } finally {
        setLoading(false);
      }
    }
    
    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user;
        setUser(currentUser ?? null);
        
        if (currentUser) {
             if (currentUser.banned_until && new Date(currentUser.banned_until) > new Date()) {
                await supabase.auth.signOut();
                toast({ title: "Access Denied", description: "This account has been banned.", variant: "destructive" });
                setProfile(null);
             } else {
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();
                
                if (error) console.error("Error refetching profile:", error);
                else setProfile(profileData);
             }
        } else {
            setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast]);
  
  const value = { user, session, loading, profile, setProfile, supabase };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
         <div className="w-full h-screen flex items-center justify-center">
            <Skeleton className="w-full h-full" />
        </div>
      ) : children }
    </AuthContext.Provider>
  );
};
