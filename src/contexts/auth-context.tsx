
"use client";

import { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
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

// A dummy client to satisfy the initial context type. It won't be used.
const dummySupabase = createClient('http://localhost', 'dummykey');

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  setProfile: () => {},
  supabase: dummySupabase,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [supabase, setSupabase] = useState<SupabaseClient>(dummySupabase);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase credentials missing. Check your environment variables.");
      setConfigError("Supabase URL or Anon Key is not configured. Please check your environment variables.");
      setLoading(false);
      return;
    }

    const client = createClient(supabaseUrl, supabaseAnonKey);
    setSupabase(client);

    const getSessionAndProfile = async () => {
        const { data: { session } } = await client.auth.getSession();
        setSession(session);
        const currentUser = session?.user;
        setUser(currentUser ?? null);

        if (currentUser) {
            if (currentUser.banned_until && new Date(currentUser.banned_until) > new Date()) {
                await client.auth.signOut();
                toast({ title: "Access Denied", description: "This account has been banned.", variant: "destructive" });
                setUser(null);
                setSession(null);
                setProfile(null);
            } else {
                const { data: profileData, error } = await client
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();
                
                if (error) console.error("Error fetching profile:", error);
                else setProfile(profileData);
            }
        }
        setLoading(false);
    }
    
    getSessionAndProfile();

    const { data: authListener } = client.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user;
        setUser(currentUser ?? null);
        
        if (currentUser) {
             if (currentUser.banned_until && new Date(currentUser.banned_until) > new Date()) {
                await client.auth.signOut();
                toast({ title: "Access Denied", description: "This account has been banned.", variant: "destructive" });
                setProfile(null);
             } else {
                const { data: profileData, error } = await client
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

  if (configError) {
    return (
        <div className="w-full h-screen flex items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>{configError}</AlertDescription>
            </Alert>
        </div>
    );
  }

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
