import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function ViewingSchedulesManagement() {
  const [schedules, setSchedules] = useState<ViewingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<ViewingSchedule | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchSchedules = async () => {
    try {
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("viewing_schedules")
        .select("*")
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (schedulesError) throw schedulesError;

      // Fetch property and profile data separately
      const enrichedSchedules = await Promise.all(
        (schedulesData || []).map(async (schedule) => {
          const [propertyResult, profileResult] = await Promise.all([
            supabase
              .from("properties")
              .select("title, location")
              .eq("id", schedule.property_id)
              .maybeSingle(),
            supabase
              .from("profiles")
              .select("full_name")
              .eq("id", schedule.user_id)
              .maybeSingle(),
          ]);

          if (profileResult.error) {
            console.error("Profile fetch error for user:", schedule.user_id, profileResult.error);
          }

          return {
            ...schedule,
            properties: propertyResult.data || undefined,
            profiles: profileResult.data || undefined,
          };
        })
      );

      setSchedules(enrichedSchedules);
    } catch (error: any) {
      toast.error("Failed to fetch viewing schedules");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const updateScheduleStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("viewing_schedules")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Viewing ${status === "confirmed" ? "confirmed" : "cancelled"}`);
      fetchSchedules();
      setDetailsOpen(false);
    } catch (error: any) {
      toast.error("Failed to update viewing schedule");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
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
        <h1 className="text-3xl font-bold tracking-tight">Viewing Schedules</h1>
        <p className="text-muted-foreground">
          Manage property viewing appointments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Viewing Schedules</CardTitle>
          <CardDescription>
            View and manage all property viewing appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No viewing schedules found
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
                  {schedules.map((schedule) => (
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
                      <TableCell>{getStatusBadge(schedule.status)}</TableCell>
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
                <div className="mt-1">{getStatusBadge(selectedSchedule.status)}</div>
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
