
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

  useEffect(() => {
    // This function handles the initial session load and sets up the listener.
    const initializeSession = async () => {
      // Get the initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', initialSession.user.id)
          .single();
        setProfile(profileData);
      }
      // CRITICAL: Set loading to false after the initial check is complete.
      setLoading(false);

      // Set up the auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          if (newSession?.user) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newSession.user.id)
              .single();
            setProfile(profileData);
          } else {
            setProfile(null);
          }
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    };

    initializeSession();
  }, [supabase]);

  const value = { user, session, loading, profile, setProfile, supabase };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="w-full h-screen flex items-center justify-center bg-secondary">
          <img
            src="https://i.postimg.cc/QCbMpVpx/Chat-GPT-Image-Aug-16-2025-09-48-41-PM.png"
            alt="TeeMart Logo"
            width={80}
            height={80}
            className="animate-pulse"
          />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
