import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { format } from "date-fns";
import { Check, X, Eye, CheckCircle, XCircle, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface ViewingSchedule {
  id: string;
  property_id: string;
  user_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  properties?: {
    title: string;
    location: string;
  };
  profiles?: {
    full_name: string;
  };
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [schedules, setSchedules] = useState<ViewingSchedule[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<ViewingSchedule | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");
  const [viewingStatusFilter, setViewingStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const bookingStatuses = ["pending", "approved", "rejected", "confirmed", "completed"];
  const viewingStatuses = ["pending", "confirmed", "completed", "cancelled"];

  const filteredBookings = useMemo(() => {
    if (bookingStatusFilter === "all") return bookings;
    return bookings.filter((booking) => booking.status === bookingStatusFilter);
  }, [bookings, bookingStatusFilter]);

  const filteredSchedules = useMemo(() => {
    if (viewingStatusFilter === "all") return schedules;
    return schedules.filter((schedule) => schedule.status === viewingStatusFilter);
  }, [schedules, viewingStatusFilter]);

  useEffect(() => {
    fetchBookings();
    fetchSchedules();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get("/api/admin/booking-requests", {
        params: {
          orderBy: "created_at",
          orderDirection: "desc",
          include: "provider,profile",
        },
      });
      setBookings(response.data || []);
    } catch (error) {
      console.error("Error fetching booking requests:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await api.get("/api/admin/viewing-schedules", {
        params: {
          include: "property,profile",
          orderBy: "scheduled_date",
          orderDirection: "asc",
        },
      });
      setSchedules(response.data || []);
    } catch (error) {
      console.error("Error fetching viewing schedules:", error);
      sonnerToast.error("Failed to fetch viewing schedules");
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      await api.put(`/api/admin/booking-requests/${bookingId}/approve`);

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
      await api.put(`/api/admin/booking-requests/${bookingId}/reject`);

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

  const updateScheduleStatus = async (id: string, status: string) => {
    try {
      await api.put(`/api/admin/viewing-schedules/${id}`, { status });

      sonnerToast.success(`Viewing ${status === "confirmed" ? "confirmed" : status === "completed" ? "marked as completed" : "cancelled"}`);
      fetchSchedules();
      setDetailsOpen(false);
    } catch (error) {
      console.error("Error updating viewing schedule:", error);
      sonnerToast.error("Failed to update viewing schedule");
    }
  };

  const getViewingStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "default",
      cancelled: "destructive",
      completed: "secondary",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Bookings Management</h2>
        <p className="text-muted-foreground mt-2">Manage service bookings and property viewings</p>
      </div>

      <Tabs defaultValue="service-bookings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="service-bookings">Service Bookings ({bookings.length})</TabsTrigger>
          <TabsTrigger value="viewing-schedules">Viewing Schedules ({schedules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="service-bookings" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>All Booking Requests</CardTitle>
                <CardDescription>View and manage service booking requests</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {bookingStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {bookingStatusFilter === "all" ? "No booking requests found" : `No ${bookingStatusFilter} booking requests found`}
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                      {filteredBookings.map((booking) => (
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viewing-schedules" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>All Viewing Schedules</CardTitle>
                <CardDescription>View and manage property viewing appointments</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={viewingStatusFilter} onValueChange={setViewingStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {viewingStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSchedules ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredSchedules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {viewingStatusFilter === "all" ? "No viewing schedules found" : `No ${viewingStatusFilter} viewing schedules found`}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {schedule.properties?.title || "Unknown Property"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {schedule.properties?.location}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {schedule.profiles?.full_name || "Unknown User"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{format(new Date(schedule.scheduled_date), "MMM dd, yyyy")}</div>
                              <div className="text-sm text-muted-foreground">
                                {schedule.scheduled_time}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getViewingStatusBadge(schedule.status)}</TableCell>
                          <TableCell>
                            {format(new Date(schedule.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSchedule(schedule);
                                setDetailsOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Viewing Schedule Details</DialogTitle>
            <DialogDescription>
              Review and manage this viewing appointment
            </DialogDescription>
          </DialogHeader>

          {selectedSchedule && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Property</div>
                <div className="font-medium">
                  {selectedSchedule.properties?.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedSchedule.properties?.location}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">User</div>
                <div className="font-medium">
                  {selectedSchedule.profiles?.full_name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">
                    {format(new Date(selectedSchedule.scheduled_date), "MMM dd, yyyy")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div className="font-medium">{selectedSchedule.scheduled_time}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="mt-1">{getViewingStatusBadge(selectedSchedule.status)}</div>
              </div>

              {selectedSchedule.notes && (
                <div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                    {selectedSchedule.notes}
                  </div>
                </div>
              )}

              {selectedSchedule.status === "pending" && (
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() =>
                      updateScheduleStatus(selectedSchedule.id, "confirmed")
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() =>
                      updateScheduleStatus(selectedSchedule.id, "cancelled")
                    }
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}

              {selectedSchedule.status === "confirmed" && (
                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={() =>
                      updateScheduleStatus(selectedSchedule.id, "completed")
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}