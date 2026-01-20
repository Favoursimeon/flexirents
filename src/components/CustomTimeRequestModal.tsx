import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";

const requestSchema = z.object({
  requestedDate: z.string().min(1, "Please select a date"),
  requestedTime: z.string().min(1, "Please select a time"),
  requestedHours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Hours must be a positive number",
  }),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface CustomTimeRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  serviceType: string;
  providerName: string;
}

export const CustomTimeRequestModal = ({
  open,
  onOpenChange,
  providerId,
  serviceType,
  providerName,
}: CustomTimeRequestModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requestedDate: "",
      requestedTime: "",
      requestedHours: "1",
      notes: "",
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to request a custom time slot.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("booking_requests").insert([
        {
          user_id: user.id,
          provider_id: providerId,
          service_type: serviceType,
          requested_date: data.requestedDate,
          requested_time: data.requestedTime,
          requested_hours: parseInt(data.requestedHours),
          notes: data.notes || null,
          status: "pending",
        },
      ]);

      if (error) throw error;

      toast({
        title: "Request Submitted!",
        description: `Your custom time request has been sent to ${providerName}. You'll be notified when they respond.`,
      });

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your request. Please try again.",
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
          <DialogTitle>Request Custom Time Slot</DialogTitle>
          <DialogDescription>
            Can't find a suitable time? Request a custom time slot from {providerName}.
            They'll review your request and respond within 24-48 hours.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="requestedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Date</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        {...field}
                        min={new Date().toISOString().split("T")[0]}
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestedTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Time</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="time" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="0.5"
                      {...field}
                      placeholder="e.g., 2"
                    />
                  </FormControl>
                  <FormDescription>How many hours do you need?</FormDescription>
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
                      {...field}
                      placeholder="Any specific requirements or details about your request..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
