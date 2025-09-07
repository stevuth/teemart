
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

  const renderButton = () => {
    if (isInitializing || permissionStatus === 'default') {
      return (
        <Button
          variant="outline"
          size="sm"
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
         <Alert variant="destructive" className="max-w-xs">
              <BellOff className="h-4 w-4" />
              <AlertTitle className="text-xs">Notifications Blocked</AlertTitle>
              <AlertDescription className="text-xs">
                  Enable in browser settings.
              </AlertDescription>
          </Alert>
      );
    }
  
    if (isSubscribed) {
      return (
        <Button
          variant="destructive"
          size="sm"
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
        size="sm"
        onClick={subscribe}
      >
        <Bell className="mr-2 h-4 w-4" />
        Enable Notifications
      </Button>
    );
  }

  return <div className="flex items-center">{renderButton()}</div>
}

