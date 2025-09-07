
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
          className="h-8 px-2"
          onClick={subscribe}
          disabled={isInitializing}
        >
          {isInitializing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          <span className="sr-only sm:not-sr-only sm:ml-2">Notify</span>
        </Button>
      );
    }
  
    if (permissionStatus === 'denied') {
      return (
         <Alert variant="destructive" className="max-w-xs p-2">
              <BellOff className="h-4 w-4" />
              <AlertTitle className="text-xs sr-only">Notifications Blocked</AlertTitle>
              <AlertDescription className="text-xs">
                  Notifications Blocked
              </AlertDescription>
          </Alert>
      );
    }
  
    if (isSubscribed) {
      return (
        <Button
          variant="destructive"
          size="sm"
          className="h-8 px-2"
          onClick={unsubscribe}
        >
          <BellOff className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ml-2">Notify Off</span>
        </Button>
      );
    }
  
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2"
        onClick={subscribe}
      >
        <Bell className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-2">Notify</span>
      </Button>
    );
  }

  return <div className="flex items-center">{renderButton()}</div>
}


