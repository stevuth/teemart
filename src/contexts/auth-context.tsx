
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/utils/supabase/client';
import type { Profile } from '@/lib/types';

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
  supabase: {} as SupabaseClient,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSide, setClientSide] = useState(false);

   useEffect(() => {
    setClientSide(true);
  }, []);

  const fetchSessionAndProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        if (profileError) {
          console.error("Error fetching profile on auth change: ", profileError);
        }
        setProfile(profileData);
    } else {
        setProfile(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profileError) {
            console.error("Error fetching profile on auth change: ", profileError);
          }
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchSessionAndProfile]);

  const value = { user, session, loading, profile, setProfile, supabase };

  return (
    <AuthContext.Provider value={value}>
      {loading || !clientSide ? (
        <div className="w-full h-screen flex items-center justify-center bg-secondary">
          <img 
            src="https://i.postimg.cc/QCbMpVpx/Chat-GPT-Image-Aug-16-2025-09-48-41-PM.png" 
            alt="TeeMart Logo" 
            className="h-20 w-20 animate-pulse" 
          />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
