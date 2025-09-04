
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/utils/supabase/client';
import type { Profile } from '@/lib/types';
import { LoginModal } from '@/components/auth/login-modal';
import { SignupModal } from '@/components/auth/signup-modal';
import { useRouter } from 'next/navigation';

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

const pollForProfile = (
  supabase: SupabaseClient, 
  user: User, 
  retries = 5, 
  delay = 1000
): Promise<Profile | null> => {
  return new Promise(async (resolve) => {
    for (let i = 0; i < retries; i++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        return resolve(data);
      }

      if (error && error.code !== 'PGRST116') { // PGRST116 is "exact one row not found"
        return resolve(null); // Stop on real errors
      }
      
      await new Promise(res => setTimeout(res, delay * (i + 1))); // Incremental backoff
    }
    resolve(null);
  });
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const fetchProfile = useCallback(async (user: User | null, isNewSignIn = false) => {
    if (!user) {
        setProfile(null);
        return;
    }

    try {
        let { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
             console.error("Error fetching profile:", error);
             setProfile(null);
             return;
        }

        if (data) {
            setProfile(data);
        } else if (isNewSignIn) {
            const polledProfile = await pollForProfile(supabase, user);
            setProfile(polledProfile);
        } else {
             setProfile(null);
        }
    } catch (error) {
        console.error("An unexpected error occurred in fetchProfile: ", error);
        setProfile(null);
    }
  }, [supabase]);

  const refetchProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if(currentUser) {
        await fetchProfile(currentUser);
    }
  }, [supabase, fetchProfile]);

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        await fetchProfile(session?.user ?? null);
        setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        await fetchProfile(session?.user ?? null, event === 'SIGNED_IN');
        
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
             router.refresh();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, router]);

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
