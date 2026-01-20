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
import ReviewForm from "@/components/ReviewForm";
import { ProductGallery } from "@/components/ProductGallery";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Mail, Phone, Globe, Package, Star, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VendorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVendorData();
      fetchReviews();
      fetchProducts();
    }
  }, [id]);

  const fetchVendorData = async () => {
    try {
      const { data, error } = await supabase
        .from("approved_vendors")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setVendor(data);

      // Fetch average rating
      const { data: ratingData } = await supabase.rpc("get_average_rating", {
        p_target_type: "vendor",
        p_target_id: id,
      });

      setAverageRating(ratingData || 0);

      // Fetch review count
      const { data: countData } = await supabase.rpc("get_review_count", {
        p_target_type: "vendor",
        p_target_id: id,
      });

      setReviewCount(countData || 0);
    } catch (error: any) {
      console.error("Error fetching vendor:", error);
      toast({
        title: "Error",
        description: "Could not load vendor details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_products')
        .select('*')
        .eq('vendor_id', id)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles:reviewer_user_id (
            full_name
          )
        `)
        .eq("target_type", "vendor")
        .eq("target_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
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

  if (!vendor) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <p className="text-center">Vendor not found.</p>
          <Button onClick={() => navigate("/marketplace")} className="mx-auto block mt-4">
            Back to Marketplace
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
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Vendor Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="relative flex-shrink-0">
                  {vendor.profile_image_url ? (
                    <img
                      src={vendor.profile_image_url}
                      alt={vendor.business_name}
                      className="w-24 h-24 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-border flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-primary/60" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-4xl font-bold">{vendor.business_name}</h1>
                    {vendor.status === "approved" && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-lg mb-4">
                    {vendor.business_category}
                  </Badge>
                  <div className="flex items-center gap-2 mb-4">
                    <RatingStars rating={averageRating} />
                    <span className="text-sm text-muted-foreground">
                      ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button size="lg" variant="outline" onClick={() => setShowReviewForm(!showReviewForm)}>
                  Leave Review
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Vendor Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span>{vendor.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span>{vendor.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>{vendor.location}, {vendor.region}</span>
                </div>
                {vendor.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <a 
                      href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Contact Person</p>
                  <p className="font-medium">{vendor.contact_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="font-medium">{vendor.business_category}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content Section */}
          <Tabs defaultValue="about" className="mb-8">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 mx-auto mb-6">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="products">Products & Services</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviewCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About {vendor.business_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {vendor.description}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Our Offerings</CardTitle>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        No products or services listed yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {products.map((product) => (
                        <Card key={product.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <ProductGallery 
                              images={product.images || []} 
                              productName={product.name}
                            />
                            <div className="p-4 space-y-2">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-lg">{product.name}</h3>
                                <Badge variant="secondary">
                                  {product.category}
                                </Badge>
                              </div>
                              {product.price && (
                                <p className="text-lg font-medium text-primary">
                                  {product.price}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {product.description}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        No reviews yet. Be the first to review!
                      </p>
                    </div>
                  ) : (
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Review Form */}
          {showReviewForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm
                  targetType="vendor"
                  targetId={id!}
                  open={showReviewForm}
                  onOpenChange={setShowReviewForm}
                  onSuccess={() => {
                    setShowReviewForm(false);
                    fetchReviews();
                    fetchVendorData();
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default VendorProfile;