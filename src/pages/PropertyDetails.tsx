import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReviewForm } from "@/components/ReviewForm";
import ReviewCard from "@/components/ReviewCard";
import RatingStars from "@/components/RatingStars";
import { 
  MapPin, Home, Bed, Bath, Maximize, Calendar, 
  Tag, CheckCircle, ArrowLeft, Heart, Star, Ruler, 
  TreePine, Building2, ParkingCircle, ChevronLeft, ChevronRight
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/contexts/WishlistContext";
import { supabase } from "@/integrations/supabase/client";

interface PropertyData {
  id: string;
  title: string;
  listing_type: string;
  description: string | null;
  region: string;
  location: string;
  price: number;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  images: string[] | null;
  features: any;
  status: string;
}

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<{
    id: string;
    rating: number;
    text?: string;
  } | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  
  const inWishlist = isInWishlist(id || "");
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    message: "",
  });
  
  const isRental = property?.listing_type === "rent";

  // Fetch property data
  useEffect(() => {
  const fetchProperty = async () => {
      if (!id) return;
      
      setLoadingProperty(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProperty(data);
        setCurrentImageIndex(0); // Reset image index when property changes
      } catch (error) {
        console.error('Error fetching property:', error);
        toast({
          title: "Error",
          description: "Failed to load property details",
          variant: "destructive",
        });
      } finally {
        setLoadingProperty(false);
      }
    };

    fetchProperty();
  }, [id]);

  // Get contextual features based on property type
  const getKeyFeatures = () => {
    if (!property) return [];
    
    const propertyType = property.property_type?.toLowerCase() || '';
    
    // Land/Plot properties
    if (propertyType.includes('land') || propertyType.includes('plot')) {
      return [
        {
          icon: <Maximize className="h-6 w-6 mb-2 text-primary" />,
          value: property.sqft || 0,
          label: "Sq Ft",
          subLabel: property.sqft ? `${(property.sqft / 43560).toFixed(2)} acres` : undefined
        },
        {
          icon: <TreePine className="h-6 w-6 mb-2 text-primary" />,
          value: "Residential",
          label: "Zoning"
        },
        {
          icon: <MapPin className="h-6 w-6 mb-2 text-primary" />,
          value: property.region,
          label: "Location"
        },
        {
          icon: <Ruler className="h-6 w-6 mb-2 text-primary" />,
          value: "Level Terrain",
          label: "Land Type"
        }
      ];
    }
    
    // Commercial properties
    if (propertyType.includes('commercial') || propertyType.includes('office') || propertyType.includes('warehouse')) {
      return [
        {
          icon: <Maximize className="h-6 w-6 mb-2 text-primary" />,
          value: property.sqft || 0,
          label: "Sq Ft"
        },
        {
          icon: <Building2 className="h-6 w-6 mb-2 text-primary" />,
          value: property.bedrooms || "Multiple",
          label: "Units/Floors"
        },
        {
          icon: <ParkingCircle className="h-6 w-6 mb-2 text-primary" />,
          value: property.bathrooms || "Available",
          label: "Parking Spaces"
        },
        {
          icon: <Home className="h-6 w-6 mb-2 text-primary" />,
          value: property.property_type,
          label: "Type"
        }
      ];
    }
    
    // Default: Residential (Apartments, Houses, etc.)
    return [
      {
        icon: <Bed className="h-6 w-6 mb-2 text-primary" />,
        value: property.bedrooms || 0,
        label: "Bedrooms"
      },
      {
        icon: <Bath className="h-6 w-6 mb-2 text-primary" />,
        value: property.bathrooms || 0,
        label: "Bathrooms"
      },
      {
        icon: <Maximize className="h-6 w-6 mb-2 text-primary" />,
        value: property.sqft || 0,
        label: "Sq Ft"
      },
      {
        icon: <Home className="h-6 w-6 mb-2 text-primary" />,
        value: property.property_type,
        label: "Type"
      }
    ];
  };

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      
      setIsLoadingReviews(true);
      try {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles:reviewer_user_id (
              full_name
            )
          `)
          .eq('target_type', 'property')
          .eq('target_id', id)
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        setReviews(reviewsData || []);
        setReviewCount(reviewsData?.length || 0);
        
        if (reviewsData && reviewsData.length > 0) {
          const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
          setAverageRating(Math.round(avg * 10) / 10);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [id]);

  // Keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!property?.images || property.images.length <= 1) return;

      if (e.key === "ArrowLeft") {
        setCurrentImageIndex((prev) =>
          property.images ? (prev - 1 + property.images.length) % property.images.length : prev
        );
      } else if (e.key === "ArrowRight") {
        setCurrentImageIndex((prev) =>
          property.images ? (prev + 1) % property.images.length : prev
        );
      } else if (e.key === "Escape" && showLightbox) {
        setShowLightbox(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [property?.images?.length, showLightbox]);

  const keyFeatures = getKeyFeatures();

  if (loadingProperty) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">Loading property details...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">Property not found</div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleReviewSuccess = () => {
    setEditingReview(null);
    // Reload reviews after successful submission
    const fetchReviews = async () => {
      if (!id) return;
      
      try {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles:reviewer_user_id (
              full_name
            )
          `)
          .eq('target_type', 'property')
          .eq('target_id', id)
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        setReviews(reviewsData || []);
        setReviewCount(reviewsData?.length || 0);
        
        if (reviewsData && reviewsData.length > 0) {
          const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
          setAverageRating(Math.round(avg * 10) / 10);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
  };

  const handleEditReview = (reviewId: string, rating: number, reviewText?: string) => {
    setEditingReview({ id: reviewId, rating, text: reviewText });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('reviewer_user_id', user.id);

      if (error) throw error;

      toast({
        title: "Review Deleted",
        description: "Your review has been deleted successfully.",
      });

      handleReviewSuccess();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProceedToPayment = () => {
    if (!user) {
      // Store the current page as the return URL
      toast({
        title: "Login Required",
        description: "Please log in to proceed with payment.",
      });
      navigate('/auth', { 
        state: { 
          returnUrl: location.pathname + location.search 
        } 
      });
      return;
    }

    // User is authenticated, proceed to checkout
    navigate('/checkout', {
      state: {
        type: isRental ? 'rental' : 'sale',
      property: {
        id: property.id,
        title: property.title,
        price: `$${property.price}`,
        location: property.location,
        image: property.images?.[0] || "/placeholder.svg"
      }
      }
    });
  };

  const handleWishlistToggle = async () => {
    if (inWishlist) {
      await removeFromWishlist(id || "1");
      toast({
        title: "Removed from wishlist",
        description: `${property.title} has been removed from your wishlist.`,
      });
    } else {
      await addToWishlist({
        id: id || "",
        type: isRental ? "rental" : "sale",
        title: property.title,
        price: `$${property.price}`,
        location: property.location,
        image: property.images?.[0] || "/placeholder.svg",
      });
      toast({
        title: "Added to wishlist",
        description: `${property.title} has been added to your wishlist.`,
      });
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !property) {
      toast({
        title: "Error",
        description: "You must be logged in to schedule a viewing.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("viewing_schedules")
        .insert({
          property_id: property.id,
          user_id: user.id,
          scheduled_date: scheduleForm.date,
          scheduled_time: scheduleForm.time,
          notes: scheduleForm.message || null,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Viewing scheduled!",
        description: `Your viewing request for ${property.title} has been submitted. We'll contact you soon to confirm.`,
      });
      
      setShowSchedule(false);
      setScheduleForm({
        name: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        message: "",
      });
    } catch (error: any) {
      console.error("Error scheduling viewing:", error);
      toast({
        title: "Error",
        description: "Failed to schedule viewing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const images = property?.images && property.images.length > 0 
    ? property.images 
    : ["/placeholder.svg"];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Listings
        </Button>

        {/* Hero Image Gallery */}
        <div 
          className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden mb-8 group cursor-pointer"
          onClick={() => setShowLightbox(true)}
        >
          <img 
            src={images[currentImageIndex]} 
            alt={`${property.title} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          <Badge className="absolute top-4 right-4 text-lg px-4 py-2 z-10">
            {property.listing_type === "rent" ? "For Rent" : "For Sale"}
          </Badge>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 left-4 z-10"
            onClick={handleWishlistToggle}
          >
            <Heart
              className="h-5 w-5"
              fill={inWishlist ? "currentColor" : "none"}
            />
          </Button>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  previousImage();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>

              {/* Image Indicators */}
              <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? "bg-primary w-8" 
                        : "bg-background/60 hover:bg-background/80"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Lightbox Overlay */}
        <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
          <DialogContent className="max-w-screen-xl w-full h-[90vh] p-0 bg-black/95 border-none">
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={images[currentImageIndex]} 
                alt={`${property.title} - Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20"
                    onClick={previousImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>

                  {/* Image Counter in Lightbox */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>

                  {/* Thumbnail Navigation */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 max-w-full overflow-x-auto px-4">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex 
                            ? "border-primary scale-110" 
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img 
                          src={img} 
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Price */}
            <Card>
              <CardContent className="pt-6">
                <h1 className="text-3xl font-bold mb-4">{property.title}</h1>
                <div className="text-3xl font-bold text-primary mb-4">
                  {isRental ? `${formatPrice(property.price)}/month` : formatPrice(property.price)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{property.location}, {property.region}</span>
                </div>
              </CardContent>
            </Card>

            {/* Key Features */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Key Features</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {keyFeatures.map((feature, index) => (
                    <div key={index} className="flex flex-col items-center p-4 bg-muted rounded-lg">
                      {feature.icon}
                      <span className="font-semibold text-center">{feature.value}</span>
                      <span className="text-sm text-muted-foreground text-center">{feature.label}</span>
                      {feature.subLabel && (
                        <span className="text-xs text-muted-foreground mt-1">{feature.subLabel}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {property.description && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Property Details */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Property Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>{property.property_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>{property.region}, {property.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Status: {property.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            {property.features?.amenities && property.features.amenities.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {property.features.amenities.map((amenity: string, index: number) => (
                       <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Facilities */}
            {property.features?.facilities && property.features.facilities.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Facilities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {property.features.facilities.map((facility: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>{facility}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Location */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </h2>
                <p className="text-muted-foreground">
                  <span className="font-medium">Address:</span> {property.location}, {property.region}
                </p>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Reviews
                    </h2>
                    {reviewCount > 0 && (
                      <div className="flex items-center gap-2">
                        <RatingStars rating={averageRating} />
                        <span className="text-sm text-muted-foreground">
                          {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button onClick={() => setShowReviewForm(true)}>
                    Post a Review
                  </Button>
                </div>

                {isLoadingReviews ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No reviews yet. Be the first to review this property!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        reviewId={review.id}
                        reviewerName={review.profiles?.full_name || 'Anonymous'}
                        reviewerUserId={review.reviewer_user_id}
                        rating={review.rating}
                        reviewText={review.review_text}
                        createdAt={review.created_at}
                        currentUserId={user?.id}
                        onEdit={handleEditReview}
                        onDelete={handleDeleteReview}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">
                  {isRental ? "Schedule a Viewing" : "Contact Agent"}
                </h2>
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={(e) => {
                          if (!user) {
                            e.preventDefault();
                            toast({
                              title: "Login Required",
                              description: "Please log in to schedule a viewing.",
                            });
                            navigate('/auth', { 
                              state: { 
                                returnUrl: location.pathname + location.search 
                              } 
                            });
                          }
                        }}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Viewing
                      </Button>
                    </DialogTrigger>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleProceedToPayment}
                  >
                    Proceed to Payment
                  </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule a Viewing for {property.title}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleScheduleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            required
                            value={scheduleForm.name}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={scheduleForm.email}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, email: e.target.value })}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            required
                            value={scheduleForm.phone}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, phone: e.target.value })}
                            placeholder="+233 XX XXX XXXX"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="date">Preferred Date</Label>
                            <Input
                              id="date"
                              type="date"
                              required
                              value={scheduleForm.date}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="time">Preferred Time</Label>
                            <Input
                              id="time"
                              type="time"
                              required
                              value={scheduleForm.time}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Additional Message (Optional)</Label>
                          <Textarea
                            id="message"
                            value={scheduleForm.message}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, message: e.target.value })}
                            placeholder="Any specific requirements or questions..."
                            rows={3}
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Confirm Schedule
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Separator className="my-4" />

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Available Now</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{property.property_type}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ReviewForm
        targetType="property"
        targetId={id || "1"}
        onSuccess={handleReviewSuccess}
        open={showReviewForm}
        onOpenChange={(open) => {
          setShowReviewForm(open);
          if (!open) setEditingReview(null);
        }}
        targetName={property.title}
        editMode={!!editingReview}
        existingReviewId={editingReview?.id}
        existingRating={editingReview?.rating}
        existingReviewText={editingReview?.text}
      />

      <Footer />
    </div>
  );
};

export default PropertyDetails;
