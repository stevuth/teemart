
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface NotificationContextType {
  notificationCount: number;
  decrementCount: (amount: number) => void;
  fetchUnreadCount: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType>({
  notificationCount: 0,
  decrementCount: () => {},
  fetchUnreadCount: async () => {},
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, supabase } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || !supabase) {
      setNotificationCount(0);
      return;
    }
    try {
      // This RPC function is now called without parameters
      const { data, error } = await supabase.rpc('get_unread_message_count');

      if (error) {
        throw error;
      }
      setNotificationCount(data);
    } catch (error: any) {
      console.error("Error fetching unread message count:", error.message || JSON.stringify(error));
      setNotificationCount(0);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!user || !supabase) {
      return;
    }

    const channel = supabase
      .channel(`realtime-notifications:${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `recipient_id=eq.${user.id}` 
        },
        (payload) => {
          fetchUnreadCount();
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Real-time notification error:', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchUnreadCount]);
  
  const decrementCount = useCallback((amount: number) => {
    setNotificationCount(prev => Math.max(0, prev - amount));
  }, []);

  const value = {
    notificationCount,
    decrementCount,
    fetchUnreadCount,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
