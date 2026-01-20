import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { User, Mail, Phone, LogOut, Settings, LayoutDashboard, FileText, MapPin, ShieldCheck, Bell, Lock, Trash2, Globe, Moon, Sun, Award, Medal, Trophy, Crown, Star, Camera, Home as HomeIcon, Shield } from "lucide-react";
import VerificationForm from "@/components/VerificationForm";
import PropertyPreferences from "@/components/PropertyPreferences";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import ClientDashboard from "@/components/ClientDashboard";
import { usePropertyNotifications } from "@/hooks/usePropertyNotifications";
import { Separator } from "@/components/ui/separator";
import RentalBillingHistory from "@/components/RentalBillingHistory";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MyRents } from "@/components/MyRents";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface Profile {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface VerificationStatus {
  status: string;
}

type ActivePanel = "dashboard" | "rents" | "billing" | "verification" | "preferences" | "settings";

const menuItems = [
  { id: "dashboard" as ActivePanel, title: "Dashboard", icon: LayoutDashboard },
  { id: "rents" as ActivePanel, title: "My Rents", icon: HomeIcon },
  { id: "billing" as ActivePanel, title: "Billing History", icon: FileText },
  { id: "verification" as ActivePanel, title: "Verification", icon: ShieldCheck },
  { id: "preferences" as ActivePanel, title: "Property Alerts", icon: Bell },
  { id: "settings" as ActivePanel, title: "Settings", icon: Settings },
];

// Profile Section Component
const ProfileSection = () => {
  const { open } = useSidebar();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({ 
    full_name: null, 
    phone: null, 
    avatar_url: null,
    created_at: new Date().toISOString()
  });
  const [customerSatisfaction, setCustomerSatisfaction] = useState(0);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMembershipDuration = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: false });
  };

  const getLastSeen = () => {
    return formatDistanceToNow(new Date(), { addSuffix: true });
  };

  const getBadgeTier = (score: number) => {
    if (score >= 90) return { name: "Platinum", icon: Crown, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" };
    if (score >= 75) return { name: "Gold", icon: Trophy, color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" };
    if (score >= 50) return { name: "Silver", icon: Medal, color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" };
    return { name: "Bronze", icon: Award, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" };
  };

  if (!open) {
    // Collapsed view - show only avatar
    return (
      <div className="p-4 border-b flex justify-center">
        <div className="relative group">
          <Avatar className="h-10 w-10 border-2 border-background shadow">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="object-cover" />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      </div>
    );
  }

  // Expanded view - show full profile
  return (
    <div className="p-4 border-b bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative group flex-shrink-0">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="object-cover" />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            )}
          </Avatar>
          <button
            onClick={() => setShowAvatarUpload(true)}
            className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            aria-label="Upload profile picture"
          >
            <Camera className="h-8 w-8 text-white" />
          </button>
        </div>
        
        <div className="w-full space-y-2">
          <h3 className="font-semibold text-foreground break-words">
            Welcome {profile.full_name ? profile.full_name.split(' ')[0] : 'Guest'}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {getMembershipDuration(profile.created_at)}
              </p>
            </div>
            {(() => {
              const badge = getBadgeTier(customerSatisfaction);
              const BadgeIcon = badge.icon;
              return (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${badge.bgColor} ${badge.borderColor} flex-shrink-0`}>
                  <BadgeIcon className={`h-3 w-3 ${badge.color}`} />
                  <span className={`text-[10px] font-semibold ${badge.color}`}>
                    {badge.name}
                  </span>
                </div>
              );
            })()}
          </div>
          {getLastSeen() && (
            <p className="text-xs text-muted-foreground">
              Last seen {getLastSeen()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ClientProfile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile>({ 
    full_name: null, 
    phone: null, 
    avatar_url: null,
    created_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [activePanel, setActivePanel] = useState<ActivePanel>(
    (location.state as any)?.activePanel || "dashboard"
  );
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingNotifications, setBookingNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [tenantAddress, setTenantAddress] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<string>("not_verified");
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [customerSatisfaction, setCustomerSatisfaction] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [deletionRequest, setDeletionRequest] = useState<any>(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [submittingDeletion, setSubmittingDeletion] = useState(false);

  // Enable property notifications
  usePropertyNotifications();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTenantAddress();
      fetchVerificationStatus();
      fetchCustomerSatisfaction();
      fetchDeletionRequest();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url, created_at")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantAddress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("rental_leases")
        .select(`
          property_id,
          properties (
            location,
            region
          )
        `)
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;

      if (data?.properties) {
        const property = data.properties as { location: string; region: string };
        setTenantAddress(`${property.location}, ${property.region}`);
      }
    } catch (error) {
      console.error("Error fetching tenant address:", error);
    }
  };

  const fetchVerificationStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_verification")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setVerificationStatus(data.status);
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    }
  };

  const fetchCustomerSatisfaction = async () => {
    if (!user) return;

    try {
      // First, check user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const userRole = roleData?.role || "user";

      // If service provider, vendor, or admin - use review-based scoring
      if (userRole === "service_provider" || userRole === "vendor" || userRole === "admin") {
        const { data: reviews, error } = await supabase
          .from("reviews")
          .select("rating")
          .eq("target_id", user.id);

        if (error) throw error;

        if (reviews && reviews.length > 0) {
          const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
          const satisfactionScore = (avgRating / 5) * 100;
          setCustomerSatisfaction(Math.round(satisfactionScore));
          setTotalReviews(reviews.length);
        } else {
          setCustomerSatisfaction(0);
          setTotalReviews(0);
        }
      } else {
        // For regular users - use activity-based scoring
        let activityScore = 0;
        let activityCount = 0;

        // Check bookings made (max 30 points)
        const { count: bookingsCount } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        
        if (bookingsCount) {
          activityScore += Math.min((bookingsCount / 5) * 30, 30); // 5+ bookings = 30 points
          activityCount += bookingsCount;
        }

        // Check wishlist items (max 20 points)
        const { count: wishlistCount } = await supabase
          .from("wishlist")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        
        if (wishlistCount) {
          activityScore += Math.min((wishlistCount / 10) * 20, 20); // 10+ items = 20 points
          activityCount++;
        }

        // Check active leases (max 25 points)
        const { count: leasesCount } = await supabase
          .from("rental_leases")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", user.id)
          .eq("status", "active");
        
        if (leasesCount) {
          activityScore += Math.min((leasesCount / 2) * 25, 25); // 2+ leases = 25 points
          activityCount++;
        }

        // Check profile completion (max 25 points)
        const profileScore = calculateProfileCompletion();
        activityScore += (profileScore / 100) * 25;

        setCustomerSatisfaction(Math.round(activityScore));
        setTotalReviews(activityCount); // Show activity count instead of review count
      }
    } catch (error) {
      console.error("Error fetching customer satisfaction:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Refetch profile to update sidebar
      await fetchProfile();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oldPassword) {
      toast.error("Please enter your current password");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      // Verify old password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: oldPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        setChangingPassword(false);
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (!deletionReason.trim()) {
      toast.error("Please provide a reason for account deletion");
      return;
    }

    setSubmittingDeletion(true);
    try {
      const { error } = await supabase
        .from("account_deletion_requests")
        .insert({
          user_id: user.id,
          reason: deletionReason,
          status: "pending"
        });

      if (error) throw error;

      toast.success("Deletion request submitted successfully. You'll be notified once it's reviewed.");
      setDeletionReason("");
      fetchDeletionRequest();
    } catch (error) {
      console.error("Error submitting deletion request:", error);
      toast.error("Failed to submit deletion request");
    } finally {
      setSubmittingDeletion(false);
    }
  };

  const fetchDeletionRequest = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("account_deletion_requests")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["pending", "approved", "rejected"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setDeletionRequest(data);
    } catch (error) {
      console.error("Error fetching deletion request:", error);
    }
  };

  const handleCancelDeletionRequest = async () => {
    if (!user || !deletionRequest) return;

    try {
      const { error } = await supabase
        .from("account_deletion_requests")
        .update({ status: "cancelled" })
        .eq("id", deletionRequest.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Deletion request cancelled successfully");
      fetchDeletionRequest();
    } catch (error) {
      console.error("Error cancelling deletion request:", error);
      toast.error("Failed to cancel deletion request");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending Review", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      approved: { label: "Approved", className: "bg-green-100 text-green-800 border-green-300" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-300" },
      cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-800 border-gray-300" }
    };
    return badges[status] || badges.pending;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMembershipDuration = (createdAt: string) => {
    try {
      const created = new Date(createdAt);
      const now = new Date();
      const diffInMonths = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
      const years = Math.floor(diffInMonths / 12);
      
      if (years >= 1) {
        return `${years}+ year${years > 1 ? 's' : ''} on Flexi`;
      } else if (diffInMonths >= 1) {
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} on Flexi`;
      } else {
        return "New on Flexi";
      }
    } catch {
      return "New on Flexi";
    }
  };

  const getLastSeen = () => {
    if (!user?.last_sign_in_at) return null;
    try {
      const distance = formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true });
      // Shorten the format: "22 minutes ago" -> "22 min ago"
      return distance
        .replace(' minutes', ' min')
        .replace(' minute', ' min')
        .replace(' hours', ' hr')
        .replace(' hour', ' hr')
        .replace(' days', ' d')
        .replace(' day', ' d')
        .replace('about ', '');
    } catch {
      return null;
    }
  };

  const getBadgeTier = (score: number) => {
    if (score >= 90) {
      return { 
        name: "Platinum", 
        icon: Crown, 
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200"
      };
    } else if (score >= 70) {
      return { 
        name: "Gold", 
        icon: Trophy, 
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200"
      };
    } else if (score >= 50) {
      return { 
        name: "Silver", 
        icon: Star, 
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200"
      };
    } else {
      return { 
        name: "Bronze", 
        icon: Medal, 
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200"
      };
    }
  };

  const getVerificationLabel = (status: string) => {
    switch (status) {
      case "verified":
        return { text: "Verified", color: "text-green-600" };
      case "pending":
        return { text: "Pending", color: "text-yellow-600" };
      case "rejected":
        return { text: "Rejected", color: "text-red-600" };
      default:
        return { text: "Not Verified", color: "text-muted-foreground" };
    }
  };

  const calculateProfileCompletion = () => {
    let completed = 0;
    let total = 3;

    // Check phone
    if (profile.phone) completed++;
    // Check avatar
    if (profile.avatar_url) completed++;
    // Check verification
    if (verificationStatus === "verified") completed++;

    return Math.round((completed / total) * 100);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-1 w-full pt-20">
          <Sidebar collapsible="icon" className="border-r pt-16 bg-background">
            <SidebarContent className="pt-2 bg-background">
              {/* User Profile Header */}
              <ProfileSection />

              <SidebarGroup>
                <SidebarGroupLabel>Account</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <TooltipProvider>
                      {menuItems.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                onClick={() => setActivePanel(item.id)}
                                isActive={activePanel === item.id}
                                className="w-full transition-all duration-200 active:scale-95 hover:scale-[1.02] active:bg-primary/20"
                              >
                                <item.icon className="mr-2 h-4 w-4 transition-transform duration-200 group-active:scale-110" />
                                <span className="transition-colors duration-200">{item.title}</span>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        </SidebarMenuItem>
                      ))}
                      <Separator className="my-2" />
                      <SidebarMenuItem>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              onClick={handleSignOut}
                              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-95 hover:scale-[1.02] active:bg-destructive/20"
                            >
                              <LogOut className="mr-2 h-4 w-4 transition-transform duration-200 group-active:scale-110" />
                              <span className="transition-colors duration-200">Sign Out</span>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            Sign Out
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    </TooltipProvider>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 p-6 pt-2">
            <div className="mb-4 flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">
                {menuItems.find(item => item.id === activePanel)?.title}
              </h1>
            </div>

            {activePanel === "dashboard" && (
              <ClientDashboard />
            )}

            {activePanel === "rents" && (
              <MyRents />
            )}

            {activePanel === "billing" && (
              <RentalBillingHistory />
            )}

            {activePanel === "verification" && (
              <VerificationForm />
            )}

            {activePanel === "preferences" && (
              <PropertyPreferences />
            )}

            {activePanel === "settings" && (
              <div className="max-w-3xl space-y-6">
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">
                              <User className="inline h-4 w-4 mr-2" />
                              Full Name
                            </Label>
                            <Input
                              id="fullName"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Enter your full name"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">
                              <Mail className="inline h-4 w-4 mr-2" />
                              Email
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={user.email || ""}
                              disabled
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">
                              <Phone className="inline h-4 w-4 mr-2" />
                              Phone Number
                            </Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Enter your phone number"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="address">
                              <MapPin className="inline h-4 w-4 mr-2" />
                              Current Address
                            </Label>
                            <Input
                              id="address"
                              value={tenantAddress || "No active lease"}
                              disabled
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                              {tenantAddress 
                                ? "This is the address of your leased property" 
                                : "You don't have an active rental lease at the moment"}
                            </p>
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={updating}
                          >
                            {updating ? "Updating..." : "Update Profile"}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notifications" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Notification Preferences</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive email updates about your account
                            </p>
                          </div>
                          <Switch
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Booking Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified about booking updates and reminders
                            </p>
                          </div>
                          <Switch
                            checked={bookingNotifications}
                            onCheckedChange={setBookingNotifications}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Property Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                              Managed in Property Alerts section
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActivePanel("preferences")}
                          >
                            Configure
                          </Button>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Marketing Emails</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive promotional emails and special offers
                            </p>
                          </div>
                          <Switch
                            checked={marketingEmails}
                            onCheckedChange={setMarketingEmails}
                          />
                        </div>

                        <Button 
                          className="w-full"
                          onClick={() => toast.success("Notification preferences saved")}
                        >
                          Save Preferences
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="text-center py-4">
                          <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
                          <h3 className="font-semibold mb-2">Manage Your Security</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Change your password, enable two-factor authentication, and manage connected accounts.
                          </p>
                          <Button onClick={() => navigate("/security-settings")}>
                            <Lock className="h-4 w-4 mr-2" />
                            Go to Security Settings
                          </Button>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>Verification Status</Label>
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm">Identity Verification</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActivePanel("verification")}
                            >
                              Manage
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="privacy" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Privacy Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Profile Visibility</Label>
                            <p className="text-sm text-muted-foreground">
                              Make your profile visible to other users
                            </p>
                          </div>
                          <Switch
                            checked={profileVisibility}
                            onCheckedChange={setProfileVisibility}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>Data & Privacy</Label>
                          <p className="text-sm text-muted-foreground mb-4">
                            Manage your personal data and privacy preferences
                          </p>
                          <Button variant="outline" className="w-full">
                            <Globe className="h-4 w-4 mr-2" />
                            Download My Data
                          </Button>
                        </div>

                        <Button 
                          className="w-full"
                          onClick={() => toast.success("Privacy settings saved")}
                        >
                          Save Privacy Settings
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-destructive">
                      <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {deletionRequest && deletionRequest.status !== "cancelled" ? (
                          <div className="space-y-4">
                            <div className="p-4 border rounded-lg bg-muted/50">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold">Account Deletion Request</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(deletionRequest.status).className}`}>
                                  {getStatusBadge(deletionRequest.status).label}
                                </span>
                              </div>
                              <div className="space-y-2 text-sm text-muted-foreground">
                                <p><strong>Requested:</strong> {new Date(deletionRequest.requested_at).toLocaleDateString()}</p>
                                {deletionRequest.reason && (
                                  <p><strong>Reason:</strong> {deletionRequest.reason}</p>
                                )}
                                {deletionRequest.status === "rejected" && deletionRequest.admin_notes && (
                                  <p className="text-destructive"><strong>Admin Notes:</strong> {deletionRequest.admin_notes}</p>
                                )}
                                {deletionRequest.status === "approved" && (
                                  <p className="text-green-600 font-medium">Your account will be deleted within 24-48 hours.</p>
                                )}
                              </div>
                            </div>
                            
                            {deletionRequest.status === "pending" && (
                              <Button 
                                variant="outline"
                                className="w-full"
                                onClick={handleCancelDeletionRequest}
                              >
                                Cancel Deletion Request
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="deletionReason">Reason for Account Deletion</Label>
                              <textarea
                                id="deletionReason"
                                className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background resize-none"
                                placeholder="Please tell us why you want to delete your account..."
                                value={deletionReason}
                                onChange={(e) => setDeletionReason(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Your request will be reviewed by our team. You'll be notified of the decision.
                              </p>
                            </div>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  className="w-full"
                                  disabled={!deletionReason.trim()}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Request Account Deletion
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Request Account Deletion?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Your deletion request will be submitted for admin review. If approved, 
                                    your account and all associated data will be permanently deleted. 
                                    This action cannot be undone once approved.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteAccount}
                                    disabled={submittingDeletion}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {submittingDeletion ? "Submitting..." : "Submit Request"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </main>
        </div>
      </SidebarProvider>
      
      <div className="relative z-10">
        <Footer />
      </div>
      
      {/* Profile Picture Upload Dialog */}
      {showAvatarUpload && user && (
        <ProfilePictureUpload
          currentImageUrl={profile.avatar_url}
          onImageUpdate={(url) => {
            setProfile({ ...profile, avatar_url: url });
            setShowAvatarUpload(false);
            toast.success("Profile picture updated successfully!");
          }}
          bucketName="avatars"
          userType="user"
          userId={user.id}
        />
      )}
    </div>
  );
}
