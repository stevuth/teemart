
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
    if (!user) {
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

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:messages:new')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `recipient_id=eq.${user.id}` 
        },
        (payload) => {
          setNotificationCount(currentCount => currentCount + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const decrementCount = useCallback((amount: number) => {
    // A simple way to trigger a refetch after marking messages as read
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
