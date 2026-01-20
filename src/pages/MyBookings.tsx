import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageSquare, Calendar, Clock, User, Star } from "lucide-react";
import { MessagingDialog } from "@/components/MessagingDialog";
import { ReviewForm } from "@/components/ReviewForm";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  status: string;
  total_hours: number;
  notes: string | null;
  created_at: string;
  service_provider_id: string;
  provider_name?: string;
  unread_count?: number;
  has_reviewed?: boolean;
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    
    const { data: bookingsData, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
      setLoading(false);
      return;
    }

    // Fetch provider names, unread message counts, and review status
    const enrichedBookings = await Promise.all(
      (bookingsData || []).map(async (booking) => {
        const { data: providerData } = await supabase
          .from("service_provider_registrations")
          .select("provider_name")
          .eq("id", booking.service_provider_id)
          .single();

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("booking_id", booking.id)
          .eq("read", false)
          .neq("sender_id", user?.id || "");

        // Check if user has already reviewed this booking
        const { data: existingReview } = await supabase
          .from("reviews")
          .select("id")
          .eq("booking_id", booking.id)
          .eq("reviewer_user_id", user?.id || "")
          .maybeSingle();

        return {
          ...booking,
          provider_name: providerData?.provider_name || "Unknown Provider",
          unread_count: count || 0,
          has_reviewed: !!existingReview,
        };
      })
    );

    setBookings(enrichedBookings);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    }
  };

  const handleOpenMessaging = (booking: Booking) => {
    setSelectedBooking(booking);
    setMessagingOpen(true);
  };

  const handleOpenReview = (booking: Booking) => {
    setReviewBooking(booking);
    setReviewDialogOpen(true);
  };

  const handleReviewSuccess = () => {
    setReviewDialogOpen(false);
    fetchBookings(); // Refresh to update review status
    toast.success("Thank you for your review!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <p className="text-center text-muted-foreground">Loading bookings...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">My Bookings</h1>

          {bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">You haven't made any bookings yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{booking.service_type}</CardTitle>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{booking.provider_name}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(booking.booking_date), "MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.booking_time} • {booking.total_hours} hours</span>
                      </div>
                      {booking.notes && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {booking.notes}
                        </div>
                      )}
                      <div className="pt-4 flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleOpenMessaging(booking)}
                          variant="outline"
                          className="flex-1 sm:flex-none"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message Provider
                          {booking.unread_count! > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {booking.unread_count}
                            </Badge>
                          )}
                        </Button>
                        {booking.status === "completed" && !booking.has_reviewed && (
                          <Button
                            onClick={() => handleOpenReview(booking)}
                            variant="default"
                            className="flex-1 sm:flex-none"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Leave Review
                          </Button>
                        )}
                        {booking.has_reviewed && (
                          <Badge variant="secondary" className="px-3 py-2">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Reviewed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {selectedBooking && (
        <MessagingDialog
          open={messagingOpen}
          onOpenChange={setMessagingOpen}
          bookingId={selectedBooking.id}
          otherPartyName={selectedBooking.provider_name || "Service Provider"}
        />
      )}

      {reviewBooking && (
        <ReviewForm
          targetType="service_provider"
          targetId={reviewBooking.service_provider_id}
          bookingId={reviewBooking.id}
          onSuccess={handleReviewSuccess}
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
        />
      )}
    </div>
  );
}
