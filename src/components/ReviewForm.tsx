import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  reviewText: z.string().max(2000, "Review must be less than 2000 characters").optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  targetType: "vendor" | "service_provider" | "client" | "property";
  targetId: string;
  bookingId?: string;
  onSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetName?: string;
  editMode?: boolean;
  existingReviewId?: string;
  existingRating?: number;
  existingReviewText?: string;
}

export const ReviewForm = ({ 
  targetType, 
  targetId, 
  bookingId, 
  onSuccess, 
  open, 
  onOpenChange,
  targetName,
  editMode = false,
  existingReviewId,
  existingRating,
  existingReviewText
}: ReviewFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingRating || 0,
      reviewText: existingReviewText || "",
    },
  });

  const rating = form.watch("rating");

  // Update form when editing existing review
  useEffect(() => {
    if (editMode && existingRating !== undefined) {
      form.setValue("rating", existingRating);
      form.setValue("reviewText", existingReviewText || "");
    }
  }, [editMode, existingRating, existingReviewText, form]);

  const onSubmit = async (data: ReviewFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to leave a review.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (data.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has completed booking/service for service providers
    if (targetType === "service_provider" && !bookingId && !editMode) {
      try {
        const { data: completedBookings, error } = await supabase
          .from("bookings")
          .select("id")
          .eq("user_id", user.id)
          .eq("service_provider_id", targetId)
          .eq("status", "completed")
          .limit(1);

        if (error) throw error;

        if (!completedBookings || completedBookings.length === 0) {
          toast({
            title: "Service Not Completed",
            description: "You can only review service providers after completing a booking with them.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error("Error checking bookings:", error);
        toast({
          title: "Error",
          description: "Could not verify booking status.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (editMode && existingReviewId) {
        // Update existing review
        const { error } = await supabase
          .from("reviews")
          .update({
            rating: data.rating,
            review_text: data.reviewText || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingReviewId)
          .eq("reviewer_user_id", user.id);

        if (error) throw error;

        toast({
          title: "Review Updated!",
          description: "Your review has been updated successfully.",
        });
      } else {
        // Create new review
        const reviewData: any = {
          reviewer_user_id: user.id,
          target_type: targetType,
          target_id: targetId,
          rating: data.rating,
          review_text: data.reviewText || null,
        };

        if (bookingId) {
          reviewData.booking_id = bookingId;
        }

        const { error } = await supabase.from("reviews").insert([reviewData]);

        if (error) throw error;

        toast({
          title: "Review Submitted!",
          description: "Thank you for your feedback.",
        });
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error.message || "There was an error submitting your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDialogTitle = () => {
    if (editMode) return "Edit Review";
    if (targetName) return `Review ${targetName}`;
    switch (targetType) {
      case "service_provider":
        return "Review Service Provider";
      case "client":
        return "Review Client";
      case "vendor":
        return "Review Vendor";
      case "property":
        return "Review Property";
      default:
        return "Leave a Review";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Rating</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={32}
                            className={
                              star <= (hoveredStar || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reviewText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your experience..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : editMode ? "Update Review" : "Submit Review"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
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

export default ReviewForm;
