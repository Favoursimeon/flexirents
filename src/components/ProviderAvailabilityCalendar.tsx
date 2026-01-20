import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay, addDays, startOfDay } from "date-fns";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ProviderAvailabilityCalendarProps {
  providerId: string;
  onSelectSlot?: (date: Date, time: string) => void;
}

export const ProviderAvailabilityCalendar = ({
  providerId,
  onSelectSlot,
}: ProviderAvailabilityCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableDates();
  }, [providerId]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlotsForDate(selectedDate);
    }
  }, [selectedDate, providerId]);

  const fetchAvailableDates = async () => {
    try {
      const today = startOfDay(new Date());
      const thirtyDaysFromNow = addDays(today, 30);

      const { data, error } = await supabase
        .from("provider_availability")
        .select("date")
        .eq("provider_id", providerId)
        .eq("is_available", true)
        .gte("date", today.toISOString().split("T")[0])
        .lte("date", thirtyDaysFromNow.toISOString().split("T")[0]);

      if (error) throw error;

      const dates = data?.map((slot) => new Date(slot.date)) || [];
      setAvailableDates(dates);
    } catch (error) {
      console.error("Error fetching available dates:", error);
    }
  };

  const fetchSlotsForDate = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("provider_availability")
        .select("*")
        .eq("provider_id", providerId)
        .eq("date", dateStr)
        .eq("is_available", true)
        .order("start_time", { ascending: true });

      if (error) throw error;

      setAvailableSlots(data || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const hasAvailability = (date: Date) => {
    return availableDates.some((availDate) => isSameDay(availDate, date));
  };

  const formatTimeSlot = (startTime: string, endTime: string) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (selectedDate && onSelectSlot) {
      onSelectSlot(selectedDate, slot.start_time);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Select a Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => {
              const today = startOfDay(new Date());
              return date < today || !hasAvailability(date);
            }}
            modifiers={{
              available: availableDates,
            }}
            modifiersClassNames={{
              available: "bg-accent/20 font-semibold",
            }}
            className={cn("rounded-md border pointer-events-auto")}
          />
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-accent/20"></div>
              <span>Available dates</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Time Slots
          </CardTitle>
          {selectedDate && (
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select a date to view available time slots</p>
            </div>
          ) : loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading time slots...</p>
            </div>
          ) : availableSlots.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant="outline"
                    className="w-full justify-between hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleSlotSelect(slot)}
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {formatTimeSlot(slot.start_time, slot.end_time)}
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Available
                    </Badge>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No available time slots for this date</p>
              <p className="text-xs mt-2">Please select another date</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
