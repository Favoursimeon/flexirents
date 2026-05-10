import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Smartphone, Info } from "lucide-react";
import { usePaymentReminders } from "@/hooks/usePaymentReminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const PaymentReminderSettings = () => {
  const { 
    enableReminders, 
    disableReminders, 
    isRemindersEnabled,
    requestNotificationPermission 
  } = usePaymentReminders();
  
  const [enabled, setEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEnabled(isRemindersEnabled());
    setPushEnabled("Notification" in window && Notification.permission === "granted");
  }, [isRemindersEnabled]);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      if (checked) {
        const pushGranted = await enableReminders();
        setPushEnabled(pushGranted);
      } else {
        disableReminders();
      }
      setEnabled(checked);
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePush = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      setPushEnabled(granted);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {enabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-lg">Payment Reminders</CardTitle>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
        <CardDescription>
          Get notified before your rent payments are due
        </CardDescription>
      </CardHeader>
      
      {enabled && (
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Notification Schedule
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1.5 ml-6 list-disc">
              <li>
                <span className="text-foreground font-medium">Urgent:</span> 3 days before due date
              </li>
              <li>
                <span className="text-foreground font-medium">Reminder:</span> 7 days before due date
              </li>
              <li>
                <span className="text-foreground font-medium">Overview:</span> Monthly payment summary
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="push-notifications" className="text-sm font-medium">
                  Push Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive alerts even when app is closed
                </p>
              </div>
            </div>
            
            {pushEnabled ? (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Enabled
              </Badge>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEnablePush}
                      disabled={loading}
                    >
                      Enable
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Allow browser notifications</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">In-App Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Toast notifications when app is open
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Always On
            </Badge>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
