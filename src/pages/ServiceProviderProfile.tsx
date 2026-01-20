import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RatingStars from "@/components/RatingStars";
import ReviewCard from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import BookingModal from "@/components/BookingModal";
import { ProviderAvailabilityCalendar } from "@/components/ProviderAvailabilityCalendar";
import { CustomTimeRequestModal } from "@/components/CustomTimeRequestModal";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  MapPin, 
  Award, 
  Clock, 
  Calendar,
  DollarSign,
  CheckCircle2,
  ArrowLeft,
  Star,
  MessageSquare,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ServiceProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [provider, setProvider] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [customRequestModalOpen, setCustomRequestModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [canReview, setCanReview] = useState(false);
  const [hasCompletedBooking, setHasCompletedBooking] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProviderData();
      fetchReviews();
      fetchPortfolioImages();
      checkCompletedBookings();
    }
  }, [id, user]);

  const checkCompletedBookings = async () => {
    if (!user || !id) {
      setCanReview(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", user.id)
        .eq("service_provider_id", id)
        .eq("status", "completed")
        .limit(1);

      if (error) throw error;

      const hasCompleted = data && data.length > 0;
      setHasCompletedBooking(hasCompleted);
      setCanReview(hasCompleted);
    } catch (error) {
      console.error("Error checking completed bookings:", error);
      setCanReview(false);
    }
  };

  const fetchProviderData = async () => {
    try {
      const { data, error } = await supabase
        .from("approved_service_providers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setProvider(data);

      // Fetch average rating
      const { data: ratingData } = await supabase.rpc("get_average_rating", {
        p_target_type: "service_provider",
        p_target_id: id,
      });

      setAverageRating(ratingData || 0);

      // Fetch review count
      const { data: countData } = await supabase.rpc("get_review_count", {
        p_target_type: "service_provider",
        p_target_id: id,
      });

      setReviewCount(countData || 0);
    } catch (error: any) {
      console.error("Error fetching provider:", error);
      toast({
        title: "Error",
        description: "Could not load provider details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles:reviewer_user_id (
            full_name,
            avatar_url
          )
        `)
        .eq("target_type", "service_provider")
        .eq("target_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchPortfolioImages = async () => {
    try {
      const { data, error } = await supabase
        .from("portfolio_images")
        .select("*")
        .eq("provider_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPortfolioImages(data || []);
    } catch (error) {
      console.error("Error fetching portfolio images:", error);
    }
  };

  const handleBookNow = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to book this service.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setBookingModalOpen(true);
  };

  const handleSlotSelect = (date: Date, time: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to book this service.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setSelectedDate(format(date, "yyyy-MM-dd"));
    setSelectedTime(time);
    setBookingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <p className="text-center">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <p className="text-center">Provider not found.</p>
          <Button onClick={() => navigate("/flexi-assist")} className="mx-auto block mt-4">
            Back to Services
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/flexi-assist")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="relative flex-shrink-0">
                        {provider.profile_image_url ? (
                          <img
                            src={provider.profile_image_url}
                            alt={provider.provider_name}
                            className="w-24 h-24 rounded-full object-cover border-2 border-border"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-border flex items-center justify-center">
                            <User className="h-12 w-12 text-primary/60" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-3xl mb-2">{provider.provider_name}</CardTitle>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary">{provider.service_category}</Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {provider.location}, {provider.region}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <RatingStars rating={averageRating || 0} />
                          <span className="text-sm text-muted-foreground">
                            ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="about" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="about">About</TabsTrigger>
                      <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                      <TabsTrigger value="reviews">Reviews</TabsTrigger>
                      <TabsTrigger value="availability">Availability</TabsTrigger>
                      <TabsTrigger value="book">Book Appointment</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="about" className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Description</h3>
                        <p className="text-muted-foreground">{provider.description}</p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-accent mt-1" />
                          <div>
                            <p className="font-medium">Experience</p>
                            <p className="text-sm text-muted-foreground">
                              {provider.years_experience} {provider.years_experience === 1 ? 'year' : 'years'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <DollarSign className="h-5 w-5 text-accent mt-1" />
                          <div>
                            <p className="font-medium">Hourly Rate</p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(parseFloat(provider.hourly_rate.replace(/[^0-9.-]+/g, "")))}/hour
                            </p>
                          </div>
                        </div>

                        {provider.certifications && (
                          <div className="flex items-start gap-3 md:col-span-2">
                            <CheckCircle2 className="h-5 w-5 text-accent mt-1" />
                            <div>
                              <p className="font-medium">Certifications</p>
                              <p className="text-sm text-muted-foreground">{provider.certifications}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="portfolio" className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-4">Work Portfolio</h3>
                        <PortfolioGallery images={portfolioImages} />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="reviews" className="space-y-4">
                      {user && (
                        <div className="mb-4">
                          {canReview ? (
                            <Button onClick={() => setReviewModalOpen(true)}>
                              Leave a Review
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Button disabled>
                                Leave a Review
                              </Button>
                              <p className="text-sm text-muted-foreground">
                                {hasCompletedBooking 
                                  ? "Loading..." 
                                  : "Complete a booking with this provider to leave a review"}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {reviews.length > 0 ? (
                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <ReviewCard
                              key={review.id}
                              reviewId={review.id}
                              rating={review.rating}
                              reviewText={review.review_text || ""}
                              reviewerName={review.profiles?.full_name || "Anonymous"}
                              reviewerUserId={review.reviewer_user_id}
                              createdAt={review.created_at}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No reviews yet. Be the first to review!</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="availability">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-accent mt-1" />
                          <div>
                            <p className="font-medium mb-2">General Availability</p>
                            <p className="text-muted-foreground">{provider.availability}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="bg-accent/10 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Check the "Book Appointment" tab to see specific available time slots and book instantly.
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="book" className="space-y-4">
                      <div className="bg-accent/10 p-4 rounded-lg mb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-2">
                              Select a date from the calendar below to see available time slots. 
                              Click on any available slot to proceed with booking.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCustomRequestModalOpen(true)}
                            className="flex items-center gap-2 whitespace-nowrap"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Request Custom Time
                          </Button>
                        </div>
                      </div>
                      <ProviderAvailabilityCalendar
                        providerId={provider.id}
                        onSelectSlot={handleSlotSelect}
                      />
                      <div className="text-center pt-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          Don't see a suitable time?
                        </p>
                        <Button
                          variant="secondary"
                          onClick={() => setCustomRequestModalOpen(true)}
                          className="w-full"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Request a Custom Time Slot
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Book This Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg">
                    <span className="text-muted-foreground">Hourly Rate</span>
                    <span className="text-2xl font-bold">
                      {formatPrice(parseFloat(provider.hourly_rate.replace(/[^0-9.-]+/g, "")))}
                    </span>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleBookNow}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Now
                  </Button>

                  <div className="text-sm text-muted-foreground text-center space-y-1">
                    <p>✓ Verified Professional</p>
                    <p>✓ Secure Booking</p>
                    <p>✓ Flexible Scheduling</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <BookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        providerId={provider.id}
        serviceType={provider.service_category}
        providerName={provider.provider_name}
        hourlyRate={parseFloat(provider.hourly_rate.replace(/[^0-9.-]+/g, ""))}
        initialDate={selectedDate}
        initialTime={selectedTime}
      />

      <ReviewForm
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        targetType="service_provider"
        targetId={provider.id}
        targetName={provider.provider_name}
        onSuccess={fetchReviews}
      />

      <CustomTimeRequestModal
        open={customRequestModalOpen}
        onOpenChange={setCustomRequestModalOpen}
        providerId={provider.id}
        serviceType={provider.service_category}
        providerName={provider.provider_name}
      />
    </div>
  );
};

export default ServiceProviderProfile;