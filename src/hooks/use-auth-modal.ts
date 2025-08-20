
"use client";

import { useContext } from 'react';
import { AuthModalContext } from '@/contexts/auth-context';

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthProvider');
  }
  return context;
};
