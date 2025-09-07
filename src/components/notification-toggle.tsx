
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
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { cn } from "@/lib/utils";

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
       <Alert variant="destructive" className="max-w-md">
            <BellOff className="h-4 w-4" />
            <AlertTitle>Notifications Blocked</AlertTitle>
            <AlertDescription>
                You have previously blocked notifications. To enable them, please go to your browser's site settings for this page and change the permission to "Allow".
            </AlertDescription>
        </Alert>
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
