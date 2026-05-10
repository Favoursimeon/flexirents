import { useEffect, useState } from "react";
import { Bell, MessageSquare, Calendar, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import api from "@/lib/api";

interface Notification {
  id: string;
  type: "message" | "booking" | "review";
  title: string;
  description: string;
  created_at: string;
  link?: string;
}

export const NotificationPanel = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications');
      setNotifications(Array.isArray(data) ? data : []);
      const { data: countData } = await api.get('/api/notifications/unread-count');
      setUnreadCount(countData?.count || 0);
    } catch (error) {
      setNotifications([]);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message": return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "booking": return <Calendar className="h-4 w-4 text-green-500" />;
      case "review": return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex gap-3 p-4 border-b hover:bg-muted/50 cursor-pointer"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{notification.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(notification.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};