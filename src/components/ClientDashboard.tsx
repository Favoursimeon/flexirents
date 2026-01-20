import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Bell, ShieldCheck, Home, TrendingUp, Calendar, Award, Heart, FileText, DollarSign, Star, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  verificationStatus: string;
  propertyAlertsEnabled: boolean;
  matchingProperties: number;
  totalBookings: number;
  activeListings: number;
  userProfile: {
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
  activityScore: number;
  wishlistCount: number;
  activeLeases: number;
  pendingPayments: number;
  reviewsReceived: number;
  averageRating: number;
  bookingRequests: number;
  productsListed: number;
  userRole: string | null;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      const [
        verificationData,
        preferencesData,
        bookingsData,
        propertiesData,
        profileData,
        wishlistData,
        leasesData,
        paymentsData,
        userRoleData,
      ] = await Promise.all([
        supabase
          .from("user_verification")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_preferences")
          .select("is_enabled")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", user.id),
        supabase
          .from("profiles")
          .select("full_name, avatar_url, created_at")
          .eq("id", user.id)
          .single(),
        supabase
          .from("wishlist")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("rental_leases")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", user.id)
          .eq("status", "active"),
        supabase
          .from("rental_payments")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", user.id)
          .eq("status", "pending"),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const userRole = userRoleData.data?.role || null;
      
      // Fetch role-specific data
      let reviewsReceived = 0;
      let averageRating = 0;
      let bookingRequests = 0;
      let productsListed = 0;

      if (userRole === 'service_provider') {
        const { data: providerData } = await supabase
          .from("service_provider_registrations")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        if (providerData) {
          const [reviewsData, requestsData] = await Promise.all([
            supabase
              .from("reviews")
              .select("rating")
              .eq("target_id", providerData.id)
              .eq("target_type", "service_provider"),
            supabase
              .from("booking_requests")
              .select("id", { count: "exact", head: true })
              .eq("provider_id", providerData.id)
              .eq("status", "pending"),
          ]);

          reviewsReceived = reviewsData.data?.length || 0;
          if (reviewsReceived > 0) {
            const totalRating = reviewsData.data?.reduce((sum, r) => sum + r.rating, 0) || 0;
            averageRating = totalRating / reviewsReceived;
          }
          bookingRequests = requestsData.count || 0;
        }
      } else if (userRole === 'vendor') {
        const { data: vendorData } = await supabase
          .from("vendor_registrations")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        if (vendorData) {
          const [reviewsData, productsData] = await Promise.all([
            supabase
              .from("reviews")
              .select("rating")
              .eq("target_id", vendorData.id)
              .eq("target_type", "vendor"),
            supabase
              .from("vendor_products")
              .select("id", { count: "exact", head: true })
              .eq("vendor_id", vendorData.id),
          ]);

          reviewsReceived = reviewsData.data?.length || 0;
          if (reviewsReceived > 0) {
            const totalRating = reviewsData.data?.reduce((sum, r) => sum + r.rating, 0) || 0;
            averageRating = totalRating / reviewsReceived;
          }
          productsListed = productsData.count || 0;
        }
      }

      // Calculate activity score
      const wishlistScore = Math.min((wishlistData.count || 0) * 5, 20);
      const leaseScore = Math.min((leasesData.count || 0) * 10, 25);
      const profileScore = profileData.data?.full_name ? 25 : 0;
      const bookingScore = Math.min((bookingsData.count || 0) * 10, 30);
      const activityScore = wishlistScore + leaseScore + profileScore + bookingScore;

      setStats({
        verificationStatus: verificationData.data?.status || "not_verified",
        propertyAlertsEnabled: preferencesData.data?.is_enabled || false,
        matchingProperties: 0,
        totalBookings: bookingsData.count || 0,
        activeListings: propertiesData.count || 0,
        userProfile: profileData.data || null,
        activityScore: activityScore,
        wishlistCount: wishlistData.count || 0,
        activeLeases: leasesData.count || 0,
        pendingPayments: paymentsData.count || 0,
        reviewsReceived,
        averageRating,
        bookingRequests,
        productsListed,
        userRole,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "text-green-500";
      case "pending":
        return "text-yellow-500";
      case "rejected":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getVerificationStatusText = (status: string) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "pending":
        return "Pending Review";
      case "rejected":
        return "Rejected";
      default:
        return "Not Verified";
    }
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
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch {
      return "Recently joined";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getActivityLevel = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-500" };
    if (score >= 60) return { label: "Very Active", color: "text-blue-500" };
    if (score >= 40) return { label: "Active", color: "text-yellow-500" };
    if (score >= 20) return { label: "Getting Started", color: "text-orange-500" };
    return { label: "New Member", color: "text-muted-foreground" };
  };

  const activityLevel = getActivityLevel(stats?.activityScore || 0);

  // Build role-specific stat cards
  const getStatCards = () => {
    const baseCards = [
      {
        title: "Verification Status",
        value: getVerificationStatusText(stats?.verificationStatus || "not_verified"),
        icon: ShieldCheck,
        color: getVerificationStatusColor(stats?.verificationStatus || "not_verified"),
        description: "Account verification",
      },
      {
        title: "Property Alerts",
        value: stats?.propertyAlertsEnabled ? "Active" : "Paused",
        icon: Bell,
        color: stats?.propertyAlertsEnabled ? "text-green-500" : "text-muted-foreground",
        description: "Notification preferences",
      },
    ];

    const roleSpecificCards = [];

    if (stats?.userRole === 'service_provider') {
      roleSpecificCards.push(
        {
          title: "Avg. Rating",
          value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A",
          icon: Star,
          color: "text-yellow-500",
          description: `${stats.reviewsReceived} reviews`,
        },
        {
          title: "Total Bookings",
          value: stats.totalBookings || 0,
          icon: Calendar,
          color: "text-blue-500",
          description: "Completed services",
        },
        {
          title: "Pending Requests",
          value: stats.bookingRequests || 0,
          icon: FileText,
          color: "text-orange-500",
          description: "Awaiting response",
        },
        {
          title: "Activity Score",
          value: `${stats.activityScore || 0}/100`,
          icon: Award,
          color: activityLevel.color,
          description: activityLevel.label,
          comingSoon: true,
        }
      );
    } else if (stats?.userRole === 'vendor') {
      roleSpecificCards.push(
        {
          title: "Avg. Rating",
          value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A",
          icon: Star,
          color: "text-yellow-500",
          description: `${stats.reviewsReceived} reviews`,
        },
        {
          title: "Products Listed",
          value: stats.productsListed || 0,
          icon: Package,
          color: "text-purple-500",
          description: "Active products",
        },
        {
          title: "Total Bookings",
          value: stats.totalBookings || 0,
          icon: Calendar,
          color: "text-blue-500",
          description: "Customer orders",
        },
        {
          title: "Activity Score",
          value: `${stats.activityScore || 0}/100`,
          icon: Award,
          color: activityLevel.color,
          description: activityLevel.label,
          comingSoon: true,
        }
      );
    } else {
      // Regular user cards
      roleSpecificCards.push(
        {
          title: "Wishlist Items",
          value: stats?.wishlistCount || 0,
          icon: Heart,
          color: "text-pink-500",
          description: "Saved properties",
        },
        {
          title: "Active Leases",
          value: stats?.activeLeases || 0,
          icon: FileText,
          color: "text-green-500",
          description: "Current rentals",
        },
        {
          title: "Pending Payments",
          value: stats?.pendingPayments || 0,
          icon: DollarSign,
          color: stats?.pendingPayments > 0 ? "text-red-500" : "text-muted-foreground",
          description: "Due payments",
        },
        {
          title: "Total Bookings",
          value: stats?.totalBookings || 0,
          icon: Calendar,
          color: "text-blue-500",
          description: "Service bookings",
        },
        {
          title: "Properties Listed",
          value: stats?.activeListings || 0,
          icon: Home,
          color: "text-purple-500",
          description: "Your listings",
        },
        {
          title: "Activity Score",
          value: `${stats?.activityScore || 0}/100`,
          icon: Award,
          color: activityLevel.color,
          description: activityLevel.label,
          comingSoon: true,
        }
      );
    }

    return [...baseCards, ...roleSpecificCards];
  };

  const statCards = getStatCards();

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card 
            key={stat.title} 
            className={`hover:shadow-md transition-shadow ${(stat as any).comingSoon ? 'opacity-40' : ''}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(stat as any).comingSoon ? 'Coming Soon' : stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>No recent activity to display.</p>
            <p className="mt-2">
              Your bookings, property interactions, and account updates will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
