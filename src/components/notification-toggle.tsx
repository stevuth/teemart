// src/components/notification-toggle.tsx
"use client";

import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Button } from "./ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NotificationToggle() {
  const {
    isSubscribed,
    subscribe,
    unsubscribe,
    permissionStatus,
    isInitializing,
  } = usePushNotifications();

  if (isInitializing || permissionStatus === 'default') {
    return (
      <Button
        variant="outline"
        className="w-full sm:w-auto"
        onClick={subscribe}
        disabled={isInitializing}
      >
        {isInitializing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Bell className="mr-2 h-4 w-4" />
        )}
        Enable Notifications
      </Button>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button variant="destructive" className="w-full sm:w-auto" disabled>
                <BellOff className="mr-2 h-4 w-4" />
                Notifications Blocked
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>You have blocked notifications. Please enable them in your browser settings.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isSubscribed) {
    return (
      <Button
        variant="destructive"
        className="w-full sm:w-auto"
        onClick={unsubscribe}
      >
        <BellOff className="mr-2 h-4 w-4" />
        Disable Notifications
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className="w-full sm:w-auto"
      onClick={subscribe}
    >
      <Bell className="mr-2 h-4 w-4" />
      Enable Notifications
    </Button>
  );
}
