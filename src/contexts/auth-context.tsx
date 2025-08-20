
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
  refetchProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  setProfile: () => {},
  supabase: {} as SupabaseClient,
  refetchProfile: async () => {},
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

  const fetchProfile = useCallback(async (user: User | null) => {
    if (user) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                // Ignore "0 rows" error, but log everything else for debugging.
                if (error.code !== 'PGRST116') {
                    console.error("Error fetching profile on auth change: ", error);
                }
                 setProfile(null);
            } else {
                setProfile(data);
            }
        } catch(e) {
            console.error("Catastrophic error fetching profile", e);
            setProfile(null);
        }
    } else {
        setProfile(null);
    }
  }, [supabase]);

  const refetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await fetchProfile(user);
  }, [supabase, fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setSession(session);
        await fetchProfile(currentUser);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const authValue = { user, session, loading, profile, setProfile, supabase, refetchProfile };
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
