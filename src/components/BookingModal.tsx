import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";

const bookingSchema = z.object({
  bookingDate: z.string().min(1, "Please select a date"),
  bookingTime: z.string().min(1, "Please select a time"),
  totalHours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Hours must be a positive number",
  }),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  serviceType: string;
  providerName: string;
  hourlyRate: number;
  initialDate?: string;
  initialTime?: string;
}

const BookingModal = ({ 
  open, 
  onOpenChange, 
  providerId, 
  serviceType, 
  providerName,
  hourlyRate,
  initialDate,
  initialTime 
}: BookingModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingDate: initialDate || "",
      bookingTime: initialTime || "",
      totalHours: "1",
      notes: "",
    },
  });
  
  const totalHours = form.watch("totalHours");
  const estimatedCost = parseFloat(totalHours || "0") * hourlyRate;

  // Update form when initial values change
  useEffect(() => {
    if (initialDate) {
      form.setValue("bookingDate", initialDate);
    }
    if (initialTime) {
      form.setValue("bookingTime", initialTime);
    }
  }, [initialDate, initialTime, form]);

  const onSubmit = async (data: BookingFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a service.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("bookings").insert([
        {
          service_provider_id: providerId,
          user_id: user.id,
          service_type: serviceType,
          booking_date: data.bookingDate,
          booking_time: data.bookingTime,
          total_hours: parseInt(data.totalHours),
          notes: data.notes || null,
          status: "pending",
        },
      ]);

      if (error) throw error;

      toast({
        title: "Booking Submitted!",
        description: `Your booking with ${providerName} has been submitted successfully.`,
      });

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book {serviceType} Service</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bookingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} min={new Date().toISOString().split('T')[0]} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bookingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Hours</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any special requests or details..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hourly Rate:</span>
                <span className="font-medium">{formatPrice(hourlyRate)}/hour</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Hours:</span>
                <span className="font-medium">{totalHours || 0}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Estimated Cost:</span>
                <span className="font-bold text-lg">{formatPrice(estimatedCost)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Submitting..." : "Confirm Booking"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;