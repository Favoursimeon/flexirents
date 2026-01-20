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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Clock, User, Mail, Phone, MapPin, Briefcase, MessageSquare, Star } from "lucide-react";
import { MessagingDialog } from "@/components/MessagingDialog";
import { ReviewForm } from "@/components/ReviewForm";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { PortfolioManagement } from "@/components/PortfolioManagement";

const profileSchema = z.object({
  providerName: z.string().min(2).max(100),
  contactName: z.string().min(2).max(100),
  phone: z.string().min(10).max(20),
  location: z.string().min(1),
  description: z.string().min(20).max(2000),
  hourlyRate: z.string().min(1),
  yearsExperience: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0),
  certifications: z.string().max(500).optional(),
  availability: z.string().min(1).max(200),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ServiceProviderDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [provider, setProvider] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProviderData();
      fetchBookings();
    }
  }, [user]);

  useEffect(() => {
    if (provider) {
      fetchPortfolioImages();
    }
  }, [provider]);

  const fetchProviderData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) return;

      const { data, error } = await supabase
        .from("service_provider_registrations")
        .select("*")
        .eq("email", userData.user.email)
        .eq("status", "approved")
        .single();

      if (error) throw error;

      setProvider(data);
      
      // Set form values
      form.reset({
        providerName: data.provider_name,
        contactName: data.contact_name,
        phone: data.phone,
        location: data.location,
        description: data.description,
        hourlyRate: data.hourly_rate,
        yearsExperience: data.years_experience.toString(),
        certifications: data.certifications || "",
        availability: data.availability,
      });
    } catch (error: any) {
      console.error("Error fetching provider:", error);
      toast({
        title: "Error",
        description: "Could not load your profile. Make sure you are registered as a service provider.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone
          )
        `)
        .order("booking_date", { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchPortfolioImages = async () => {
    if (!provider) return;
    
    try {
      const { data, error } = await supabase
        .from("portfolio_images")
        .select("*")
        .eq("provider_id", provider.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPortfolioImages(data || []);
    } catch (error) {
      console.error("Error fetching portfolio images:", error);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking status updated successfully.",
      });

      fetchBookings();
    } catch (error: any) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Could not update booking status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    if (!provider) return;

    try {
      const { error } = await supabase
        .from("service_provider_registrations")
        .update({
          provider_name: data.providerName,
          contact_name: data.contactName,
          phone: data.phone,
          location: data.location,
          description: data.description,
          hourly_rate: data.hourlyRate,
          years_experience: parseInt(data.yearsExperience),
          certifications: data.certifications || null,
          availability: data.availability,
        })
        .eq("id", provider.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
      });

      fetchProviderData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Could not update your profile.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading || authLoading) {
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
          <Card>
            <CardHeader>
              <CardTitle>Service Provider Not Found</CardTitle>
              <CardDescription>
                You need to be registered and approved as a service provider to access this dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/service-provider-registration")}>
                Register as Service Provider
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Service Provider Dashboard</h1>
          <p className="text-muted-foreground">Manage your bookings and profile</p>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>
                  Manage and update the status of your service bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No bookings yet. They will appear here once clients book your services.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Update Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {booking.profiles?.full_name || "Anonymous"}
                                </p>
                                {booking.profiles?.phone && (
                                  <p className="text-sm text-muted-foreground">
                                    {booking.profiles.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{booking.service_type}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {new Date(booking.booking_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {booking.booking_time}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{booking.total_hours}h</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={booking.status}
                              onValueChange={(value) => updateBookingStatus(booking.id, value)}
                              disabled={updatingStatus === booking.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setMessagingOpen(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Chat
                                {booking.unread_count > 0 && (
                                  <Badge variant="destructive" className="ml-2">
                                    {booking.unread_count}
                                  </Badge>
                                )}
                              </Button>
                              {booking.status === "completed" && !booking.has_reviewed_client && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setReviewBooking(booking);
                                    setReviewDialogOpen(true);
                                  }}
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Review Client
                                </Button>
                              )}
                              {booking.has_reviewed_client && (
                                <Badge variant="secondary" className="px-3 py-2">
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  Reviewed
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Gallery</CardTitle>
                <CardDescription>
                  Showcase your work with project photos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioManagement
                  providerId={provider.id}
                  images={portfolioImages}
                  onUpdate={fetchPortfolioImages}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Update your service provider information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6">
                    {/* Profile Picture Section */}
                    <div className="flex justify-center pb-6 border-b">
                      <ProfilePictureUpload
                        currentImageUrl={provider?.profile_image_url}
                        onImageUpdate={(url) => {
                          setProvider({ ...provider, profile_image_url: url });
                        }}
                        bucketName="service-provider-profiles"
                        userType="service_provider"
                        userId={provider.id}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="providerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business/Provider Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hourly Rate (GHS)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="yearsExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="availability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Availability</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Mon-Fri, 9AM-5PM" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="certifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certifications (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4">
                      <Button type="submit" className="flex-1">
                        Update Profile
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />

      {selectedBooking && (
        <MessagingDialog
          open={messagingOpen}
          onOpenChange={setMessagingOpen}
          bookingId={selectedBooking.id}
          otherPartyName={selectedBooking.profiles?.full_name || "Client"}
        />
      )}

      {reviewBooking && (
        <ReviewForm
          targetType="client"
          targetId={reviewBooking.user_id}
          bookingId={reviewBooking.id}
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          targetName={reviewBooking.profiles?.full_name}
          onSuccess={() => {
            setReviewDialogOpen(false);
            fetchBookings();
            toast({
              title: "Review Submitted",
              description: "Thank you for reviewing your client!",
            });
          }}
        />
      )}
    </div>
  );
};

export default ServiceProviderDashboard;
