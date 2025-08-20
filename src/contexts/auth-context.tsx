
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

const pollForProfile = (
  supabase: SupabaseClient, 
  user: User, 
  retries = 5, 
  delay = 500
): Promise<Profile | null> => {
  return new Promise(async (resolve, reject) => {
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
        // If it's a real error (like RLS), reject immediately.
        return reject(error);
      }
      
      // Wait for the next retry
      await new Promise(res => setTimeout(res, delay));
    }
    // After all retries, resolve with null
    resolve(null);
  });
};

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

  const fetchProfile = useCallback(async (user: User | null, isNewSignIn = false) => {
    if (!user) {
        setProfile(null);
        return null;
    }

    try {
        let profileData: Profile | null = null;
        if (isNewSignIn) {
            // For new sign-ins, poll the database to give the trigger time to create the profile.
            profileData = await pollForProfile(supabase, user);
        } else {
            // For existing sessions, just fetch it directly.
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (error && error.code !== 'PGRST116') throw error; // Ignore "row not found" error
            profileData = data;
        }
        
        setProfile(profileData);
        return profileData;

    } catch (error) {
        console.error("Error fetching profile: ", error);
        setProfile(null);
        return null;
    }
  }, [supabase]);

  const refetchProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if(currentUser) {
        await fetchProfile(currentUser);
    }
  }, [supabase, fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setSession(session);
        // The `_event` tells us if it was a new sign-in
        await fetchProfile(currentUser, _event === 'SIGNED_IN');
        setLoading(false);
      }
    );

    // Initial load for existing session
    const initialize = async () => {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);
        setSession(initialSession);
        await fetchProfile(currentUser);
        setLoading(false);
    }
    initialize();

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
