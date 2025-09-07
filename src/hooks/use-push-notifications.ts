
// src/hooks/use-push-notifications.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

// This VAPID key is public and safe to expose.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export function usePushNotifications() {
  const { user, supabase } = useAuth();
  const { toast } = useToast();

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isInitializing, setIsInitializing] = useState(true);

  const getServiceWorkerRegistration = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        // .ready waits for the service worker to be active
        const registration = await navigator.serviceWorker.ready;
        return registration;
      } catch (error) {
        console.error("Service worker not ready:", error);
        return null;
      }
    }
    return null;
  }, []);

  const getExistingSubscription = useCallback(async () => {
    const registration = await getServiceWorkerRegistration();
    if (registration) {
      return registration.pushManager.getSubscription();
    }
    return null;
  }, [getServiceWorkerRegistration]);


  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setIsInitializing(false);
        return;
      }
      try {
        setPermissionStatus(Notification.permission);
        const subscription = await getExistingSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error("Error checking subscription status:", error);
      } finally {
        setIsInitializing(false);
      }
    };
    checkSubscription();
  }, [user, getExistingSubscription]);

  const saveTokenToDb = useCallback(async (token: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('add_fcm_token', { new_token: token });
      if (error) throw error;
      return data;
    } catch (dbError) {
      console.error("Error saving token to DB:", dbError);
      throw dbError;
    }
  }, [user, supabase]);

  const removeTokenFromDb = useCallback(async (token: string) => {
    if (!user) return;
    try {
        await supabase.rpc('remove_fcm_token', { token_to_remove: token });
    } catch (dbError) {
        console.error("Error removing token from DB:", dbError);
        // We don't throw here, as the user can still re-subscribe.
    }
  }, [user, supabase]);


  const subscribe = async () => {
    if (!user) {
      toast({ title: "Please log in", description: "You must be logged in to enable notifications.", variant: "destructive"});
      return;
    }

    if (Notification.permission === 'denied') {
      toast({ title: "Permission Denied", description: "You have blocked notifications. Please enable them in your browser settings.", variant: "destructive"});
      return;
    }

    setIsInitializing(true);
    try {
        const registration = await getServiceWorkerRegistration();
        if (!registration) throw new Error("Service worker not available or not active.");

        // We lazy-load firebase here to avoid loading it on every page.
        const { getMessaging, getToken } = await import("firebase/messaging");
        const { app } = await import("@/lib/firebase");
        const messaging = getMessaging(app);
        
        const fcmToken = await getToken(messaging, { vapidKey: VAPID_PUBLIC_KEY, serviceWorkerRegistration: registration });
        
        if (!fcmToken) {
            throw new Error("Could not get a notification token.");
        }
        
        await saveTokenToDb(fcmToken);
        
        setIsSubscribed(true);
        setPermissionStatus('granted');
        toast({ title: "Notifications Enabled!", description: "You will now receive updates on your device."});

    } catch (error: any) {
        console.error("Error subscribing to push notifications:", error);
        toast({ title: "Subscription Failed", description: error.message, variant: "destructive"});
    } finally {
        setIsInitializing(false);
    }
  };

  const unsubscribe = async () => {
     try {
        const subscription = await getExistingSubscription();
        if (subscription) {
            await subscription.unsubscribe();
            // The FCM token is associated with the subscription endpoint.
            // When unsubscribing, the browser handles invalidating this.
            // For robustness, we can try to remove the specific endpoint from our DB if we stored it.
            // Since we store fcmToken directly, which can be different, we rely on the user re-subscribing.
        }
        setIsSubscribed(false);
        toast({ title: "Notifications Disabled" });
     } catch (error: any) {
        console.error("Error unsubscribing:", error);
        toast({ title: "Unsubscribe Failed", description: error.message, variant: "destructive" });
     }
  };


  return { isSubscribed, subscribe, unsubscribe, permissionStatus, isInitializing };
}
