import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Store, Mail, Phone, MapPin, Globe, FileText, Star, TrendingUp, Plus, Edit, Trash2, Package } from "lucide-react";
import RatingStars from "@/components/RatingStars";
import { ghanaRegions } from "@/data/ghanaLocations";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductForm } from "@/components/ProductForm";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const profileSchema = z.object({
  businessName: z.string().trim().min(2, "Business name must be at least 2 characters").max(100),
  contactName: z.string().trim().min(2, "Contact name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(10, "Phone must be at least 10 characters").max(20),
  region: z.string().min(1, "Please select a region"),
  location: z.string().trim().min(1, "Location is required"),
  businessCategory: z.string().min(1, "Please select a category"),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(2000),
  website: z.string().trim().url("Invalid URL").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const VendorDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const selectedRegion = watch("region");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchVendorData();
      fetchReviews();
      fetchProducts();
    }
  }, [user]);

  const fetchVendorData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) return;

      const { data, error } = await supabase
        .from("vendor_registrations")
        .select("*")
        .eq("email", userData.user.email)
        .eq("status", "approved")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "No Vendor Profile",
          description: "Please complete your vendor registration first.",
        });
        navigate("/vendor-registration");
        return;
      }

      setVendor(data);
      
      // Set form values
      reset({
        businessName: data.business_name,
        contactName: data.contact_name,
        email: data.email,
        phone: data.phone,
        region: data.region,
        location: data.location,
        businessCategory: data.business_category,
        description: data.description,
        website: data.website || "",
      });

      // Fetch ratings
      const { data: ratingData } = await supabase.rpc("get_average_rating", {
        p_target_type: "vendor",
        p_target_id: data.id,
      });
      setAverageRating(ratingData || 0);

      const { data: countData } = await supabase.rpc("get_review_count", {
        p_target_type: "vendor",
        p_target_id: data.id,
      });
      setReviewCount(countData || 0);

    } catch (error: any) {
      console.error("Error fetching vendor:", error);
      toast({
        title: "Error",
        description: "Could not load vendor profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!vendor) return;

    try {
      const { data, error } = await supabase
        .from('vendor_products')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) return;

      const { data: vendorData } = await supabase
        .from("vendor_registrations")
        .select("id")
        .eq("email", userData.user.email)
        .eq("status", "approved")
        .maybeSingle();

      if (!vendorData) return;

      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles:reviewer_user_id (
            full_name,
            avatar_url
          )
        `)
        .eq("target_type", "vendor")
        .eq("target_id", vendorData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!vendor) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("vendor_registrations")
        .update({
          business_name: data.businessName,
          contact_name: data.contactName,
          email: data.email,
          phone: data.phone,
          region: data.region,
          location: data.location,
          business_category: data.businessCategory,
          description: data.description,
          website: data.website || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendor.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor profile updated successfully!",
      });

      fetchVendorData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) {
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
          <Card>
            <CardContent className="pt-6 text-center">
              <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg mb-4">No vendor profile found</p>
              <Button onClick={() => navigate("/vendor-registration")}>
                Complete Vendor Registration
              </Button>
            </CardContent>
          </Card>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Vendor Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your business profile and view your performance
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent" />
                  <span className="text-2xl font-bold">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
                <RatingStars rating={averageRating} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <span className="text-2xl font-bold">{reviewCount}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Customer feedback
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Profile Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-base">
                  {vendor.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Your profile is live
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-3 mx-auto">
              <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviewCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Products & Services</CardTitle>
                      <CardDescription>
                        Showcase your offerings with detailed descriptions and images
                      </CardDescription>
                    </div>
                    <Button onClick={() => {
                      setSelectedProduct(null);
                      setProductFormOpen(true);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        No products added yet. Start showcasing your offerings!
                      </p>
                      <Button onClick={() => setProductFormOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Product
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {products.map((product) => (
                        <Card key={product.id}>
                          <CardContent className="pt-6">
                            <ProductGallery 
                              images={product.images || []} 
                              productName={product.name}
                            />
                            <div className="mt-4 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{product.name}</h3>
                                  <Badge variant="secondary" className="mt-1">
                                    {product.category}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedProduct(product);
                                      setProductFormOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleDeleteProduct(product.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialog>
                                </div>
                              </div>
                              {product.price && (
                                <p className="text-sm font-medium text-primary">
                                  {product.price}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-3">
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

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Business Profile</CardTitle>
                  <CardDescription>
                    Update your business information and details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Profile Picture Section */}
                    <div className="flex justify-center pb-6 border-b">
                      <ProfilePictureUpload
                        currentImageUrl={vendor?.profile_image_url}
                        onImageUpdate={(url) => {
                          setVendor({ ...vendor, profile_image_url: url });
                        }}
                        bucketName="vendor-profiles"
                        userType="vendor"
                        userId={vendor.id}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            Business Name
                          </div>
                        </Label>
                        <Input
                          id="businessName"
                          {...register("businessName")}
                          placeholder="Your business name"
                        />
                        {errors.businessName && (
                          <p className="text-sm text-destructive">{errors.businessName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactName">Contact Person</Label>
                        <Input
                          id="contactName"
                          {...register("contactName")}
                          placeholder="Contact person name"
                        />
                        {errors.contactName && (
                          <p className="text-sm text-destructive">{errors.contactName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="business@example.com"
                          disabled
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone
                          </div>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          {...register("phone")}
                          placeholder="+233 XX XXX XXXX"
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="region">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Region
                          </div>
                        </Label>
                        <Select
                          value={watch("region")}
                          onValueChange={(value) => setValue("region", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            {ghanaRegions.map((region) => (
                              <SelectItem key={region.name} value={region.name}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.region && (
                          <p className="text-sm text-destructive">{errors.region.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Select
                          value={watch("location")}
                          onValueChange={(value) => setValue("location", value)}
                          disabled={!selectedRegion}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedRegion &&
                              ghanaRegions
                                .find((r) => r.name === selectedRegion)
                                ?.cities.map((city) => (
                                  <SelectItem key={city} value={city}>
                                    {city}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                        {errors.location && (
                          <p className="text-sm text-destructive">{errors.location.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessCategory">Business Category</Label>
                        <Select
                          value={watch("businessCategory")}
                          onValueChange={(value) => setValue("businessCategory", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Real Estate Agency">Real Estate Agency</SelectItem>
                            <SelectItem value="Property Management">Property Management</SelectItem>
                            <SelectItem value="Construction & Renovation">Construction & Renovation</SelectItem>
                            <SelectItem value="Interior Design">Interior Design</SelectItem>
                            <SelectItem value="Legal Services">Legal Services</SelectItem>
                            <SelectItem value="Financial Services">Financial Services</SelectItem>
                            <SelectItem value="Moving Services">Moving Services</SelectItem>
                            <SelectItem value="Home Services">Home Services</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.businessCategory && (
                          <p className="text-sm text-destructive">{errors.businessCategory.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Website (Optional)
                          </div>
                        </Label>
                        <Input
                          id="website"
                          type="url"
                          {...register("website")}
                          placeholder="https://yourbusiness.com"
                        />
                        {errors.website && (
                          <p className="text-sm text-destructive">{errors.website.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Business Description
                        </div>
                      </Label>
                      <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="Describe your business, services, and what makes you unique..."
                        rows={6}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit" disabled={updating} className="flex-1">
                        {updating ? "Updating..." : "Update Profile"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => reset()}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Reviews</CardTitle>
                  <CardDescription>
                    See what customers are saying about your business
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No reviews yet. Keep providing excellent service to receive reviews!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium">
                                  {review.profiles?.full_name || "Anonymous"}
                                </p>
                                <RatingStars rating={review.rating} size={16} />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {review.review_text && (
                              <p className="text-muted-foreground">{review.review_text}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />

      <ProductForm
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        vendorId={vendor.id}
        product={selectedProduct}
        onSuccess={fetchProducts}
      />
    </div>
  );
};

export default VendorDashboard;
