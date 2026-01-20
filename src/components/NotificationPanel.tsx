import { useEffect, useState } from "react";
import { Bell, MessageSquare, Calendar, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Link } from "react-router-dom";

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

    // Set up realtime subscriptions
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          filter: `target_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Fetch unread messages
      const { data: messages } = await supabase
        .from("messages")
        .select(`
          id,
          message_text,
          created_at,
          booking_id,
          bookings!inner(user_id, service_provider_id)
        `)
        .eq("read", false)
        .neq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch recent booking updates (bookings updated in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: bookings } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          updated_at,
          booking_date,
          service_provider_registrations!inner(provider_name)
        `)
        .eq("user_id", user.id)
        .gte("updated_at", sevenDaysAgo.toISOString())
        .order("updated_at", { ascending: false })
        .limit(5);

      // Fetch recent reviews about user's bookings
      const { data: reviews } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          created_at,
          target_type,
          review_text
        `)
        .eq("target_type", "user")
        .eq("target_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const allNotifications: Notification[] = [];

      // Process messages
      if (messages) {
        messages.forEach((msg) => {
          allNotifications.push({
            id: `msg-${msg.id}`,
            type: "message",
            title: "New Message",
            description: msg.message_text.substring(0, 60) + (msg.message_text.length > 60 ? "..." : ""),
            created_at: msg.created_at,
            link: "/my-bookings",
          });
        });
      }

      // Process booking updates
      if (bookings) {
        bookings.forEach((booking) => {
          allNotifications.push({
            id: `booking-${booking.id}`,
            type: "booking",
            title: `Booking ${booking.status}`,
            description: `Your booking with ${booking.service_provider_registrations.provider_name} has been ${booking.status}`,
            created_at: booking.updated_at,
            link: "/my-bookings",
          });
        });
      }

      // Process reviews
      if (reviews) {
        reviews.forEach((review) => {
          allNotifications.push({
            id: `review-${review.id}`,
            type: "review",
            title: "New Review",
            description: `You received a ${review.rating}-star review`,
            created_at: review.created_at,
            link: "/profile",
          });
        });
      }

      // Sort by date
      allNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "booking":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "review":
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">{unreadCount} new</span>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.link || "#"}
                  onClick={() => setOpen(false)}
                  className="block p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t border-border">
            <Link to="/profile" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full">
                View All
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
