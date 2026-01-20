import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Check, X } from "lucide-react";

interface BookingRequest {
  id: string;
  requested_date: string;
  requested_time: string;
  service_type: string;
  status: string;
  requested_hours: number;
  created_at: string;
  provider_response: string | null;
  notes: string | null;
  user_id: string;
  service_provider_registrations: {
    provider_name: string;
  } | null;
  profiles: {
    full_name: string;
  } | null;
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from("booking_requests")
          .select(`
            *,
            service_provider_registrations!booking_requests_provider_id_fkey(provider_name),
            profiles!booking_requests_user_id_fkey(full_name)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (error) {
        console.error("Error fetching booking requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleApprove = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("booking_requests")
        .update({ status: "approved" })
        .eq("id", bookingId);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: "approved" } : booking
        )
      );

      toast({
        title: "Booking Approved",
        description: "The booking request has been approved successfully.",
      });
    } catch (error) {
      console.error("Error approving booking:", error);
      toast({
        title: "Error",
        description: "Failed to approve booking request.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("booking_requests")
        .update({ status: "declined" })
        .eq("id", bookingId);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: "declined" } : booking
        )
      );

      toast({
        title: "Booking Rejected",
        description: "The booking request has been rejected.",
      });
    } catch (error) {
      console.error("Error rejecting booking:", error);
      toast({
        title: "Error",
        description: "Failed to reject booking request.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Bookings Management</h2>
        <p className="text-muted-foreground mt-2">View all service bookings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Booking Requests ({bookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.profiles?.full_name || "Unknown User"}
                    </TableCell>
                    <TableCell>
                      {booking.service_provider_registrations?.provider_name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.service_type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {format(new Date(booking.requested_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{booking.requested_time}</TableCell>
                    <TableCell>{booking.requested_hours} hours</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          booking.status === "approved" ? "default" :
                          booking.status === "pending" ? "secondary" :
                          "destructive"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(booking.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {booking.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(booking.id)}
                            className="h-8"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(booking.id)}
                            className="h-8"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {booking.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
