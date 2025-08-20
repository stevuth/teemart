
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/utils/supabase/client';
import type { Profile } from '@/lib/types';
import { LoginModal } from '@/components/auth/login-modal';
import { SignupModal } from '@/components/auth/signup-modal';

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

interface AuthModalContextType {
  openLoginModal: () => void;
  openSignupModal: () => void;
}

export const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setSignupModalOpen] = useState(false);

  const openLoginModal = useCallback(() => {
    setSignupModalOpen(false);
    setLoginModalOpen(true);
  }, []);

  const openSignupModal = useCallback(() => {
    setLoginModalOpen(false);
    setSignupModalOpen(true);
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
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile on auth change: ", profileError.message);
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
          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching profile on auth change: ", profileError.message);
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

  const authValue = { user, session, loading, profile, setProfile, supabase };
  const modalValue = { openLoginModal, openSignupModal };

  return (
    <AuthContext.Provider value={authValue}>
      <AuthModalContext.Provider value={modalValue}>
        {children}
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
      </AuthModalContext.Provider>
    </AuthContext.Provider>
  );
};

    