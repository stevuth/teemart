
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface NotificationContextType {
  notificationCount: number;
  decrementCount: (amount: number) => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  notificationCount: 0,
  decrementCount: () => {},
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
      const { data, error } = await supabase.rpc('get_unread_message_count', { p_user_id: user.id });
      if (error) throw error;
      setNotificationCount(data);
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      setNotificationCount(0);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const setupSubscription = useCallback(() => {
    if (!user || !supabase) return;

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
        if (status === 'SUBSCRIBED') {
          console.log('Real-time notifications connected!');
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Real-time notification error:', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchUnreadCount]);

  useEffect(() => {
    const cleanup = setupSubscription();
    return cleanup;
  }, [setupSubscription]);

  const decrementCount = useCallback((amount: number) => {
    if (amount === 0) {
        fetchUnreadCount();
    } else {
        setNotificationCount(prev => Math.max(0, prev - amount));
    }
  }, [fetchUnreadCount]);

  const value = {
    notificationCount,
    decrementCount,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
