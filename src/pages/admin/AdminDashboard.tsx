import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Home, Briefcase, Store, Calendar, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Eye, Clock, CheckCircle, XCircle, AlertCircle, MapPin, FileCheck, UserCheck, Bell, X, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, subDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type DateRangePreset = "today" | "this_week" | "this_month" | "last_30_days" | "last_90_days" | "custom";

interface DateRange {
  from: Date;
  to: Date;
}

interface Stats {
  users: number;
  properties: number;
  availableProperties: number;
  rentedProperties: number;
  activeLeases: number;
  serviceProviders: number;
  approvedProviders: number;
  pendingProviders: number;
  vendors: number;
  approvedVendors: number;
  pendingVendors: number;
  bookingRequests: number;
  pendingBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  viewingSchedules: number;
  pendingViewings: number;
  confirmedViewings: number;
  completedViewings: number;
  reviews: number;
  totalRevenue: number;
  totalProfit: number;
  monthlyProfit: number;
  lastMonthProfit: number;
  profitGrowth: number;
  pendingPayments: number;
  verifiedPayments: number;
  verifiedUsers: number;
  pendingVerifications: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  profit: number;
}

interface RegionData {
  name: string;
  properties: number;
  bookings: number;
}

interface RecentActivity {
  id: string;
  type: "booking" | "viewing" | "property" | "user" | "payment";
  title: string;
  description: string;
  time: string;
  status?: string;
}

interface Notification {
  id: string;
  type: "booking" | "payment" | "user" | "viewing";
  title: string;
  description: string;
  time: Date;
  read: boolean;
}

// Commission rates by payment plan type
const getCommissionRate = (notes: string | null): number => {
  if (!notes) return 0.10;
  const lower = notes.toLowerCase();
  if (lower.includes("flexmonthly") || lower.includes("15%")) return 0.15;
  if (lower.includes("flexi50") || lower.includes("12%")) return 0.12;
  if (lower.includes("flexi75") || lower.includes("10%")) return 0.10;
  if (lower.includes("full payment") || lower.includes("8%")) return 0.08;
  if (lower.includes("sale")) return 0.05;
  return 0.10;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [propertyTypeData, setPropertyTypeData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  // Date range filtering
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("this_month");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const dateRange = useMemo((): DateRange => {
    const now = new Date();
    switch (dateRangePreset) {
      case "today":
        return { from: new Date(now.setHours(0, 0, 0, 0)), to: new Date() };
      case "this_week":
        return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
      case "this_month":
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case "last_30_days":
        return { from: subDays(now, 30), to: now };
      case "last_90_days":
        return { from: subDays(now, 90), to: now };
      case "custom":
        return customDateRange;
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  }, [dateRangePreset, customDateRange]);

  const dateRangeLabel = useMemo(() => {
    switch (dateRangePreset) {
      case "today": return "Today";
      case "this_week": return "This Week";
      case "this_month": return "This Month";
      case "last_30_days": return "Last 30 Days";
      case "last_90_days": return "Last 90 Days";
      case "custom": return `${format(customDateRange.from, "MMM dd")} - ${format(customDateRange.to, "MMM dd, yyyy")}`;
    }
  }, [dateRangePreset, customDateRange]);

  const addNotification = useCallback((notification: Omit<Notification, "id" | "read" | "time">) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      time: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const months = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), 5 - i);
          return {
            start: startOfMonth(date).toISOString(),
            end: endOfMonth(date).toISOString(),
            label: format(date, "MMM"),
          };
        });

        const currentMonthStart = startOfMonth(new Date()).toISOString();
        const lastMonthStart = startOfMonth(subMonths(new Date(), 1)).toISOString();
        const lastMonthEnd = endOfMonth(subMonths(new Date(), 1)).toISOString();

        const [
          profilesResponse,
          propertiesResponse,
          availablePropertiesResponse,
          rentedPropertiesResponse,
          activeLeasesResponse,
          serviceProvidersResponse,
          approvedProvidersResponse,
          pendingProvidersResponse,
          vendorsResponse,
          approvedVendorsResponse,
          pendingVendorsResponse,
          bookingRequestsResponse,
          viewingSchedulesResponse,
          reviewsResponse,
          verifiedPaymentsResponse,
          pendingPaymentsResponse,
          userVerificationsResponse,
        ] = await Promise.all([
          api.get("/api/admin/profiles"),
          api.get("/api/admin/properties"),
          api.get("/api/admin/properties", { params: { status: "available" } }),
          api.get("/api/admin/properties", { params: { status: "rented" } }),
          api.get("/api/admin/rental-leases", { params: { status: "active" } }),
          api.get("/api/admin/service-provider-registrations"),
          api.get("/api/admin/service-provider-registrations", { params: { status: "approved" } }),
          api.get("/api/admin/service-provider-registrations", { params: { status: "pending" } }),
          api.get("/api/admin/vendor-registrations"),
          api.get("/api/admin/vendor-registrations", { params: { status: "approved" } }),
          api.get("/api/admin/vendor-registrations", { params: { status: "pending" } }),
          api.get("/api/admin/booking-requests"),
          api.get("/api/admin/viewing-schedules"),
          api.get("/api/admin/reviews"),
          api.get("/api/admin/payments", { params: { verification_status: "verified" } }),
          api.get("/api/admin/payments", { params: { verification_status: "unverified", status: "pending" } }),
          api.get("/api/admin/user-verifications"),
        ]);

        const profiles = profilesResponse.data || [];
        const propertiesData = propertiesResponse.data || [];
        const availablePropertiesData = availablePropertiesResponse.data || [];
        const rentedPropertiesData = rentedPropertiesResponse.data || [];
        const activeLeasesData = activeLeasesResponse.data || [];
        const serviceProvidersData = serviceProvidersResponse.data || [];
        const approvedProvidersData = approvedProvidersResponse.data || [];
        const pendingProvidersData = pendingProvidersResponse.data || [];
        const vendorsData = vendorsResponse.data || [];
        const approvedVendorsData = approvedVendorsResponse.data || [];
        const pendingVendorsData = pendingVendorsResponse.data || [];
        const bookingRequestsData = bookingRequestsResponse.data || [];
        const viewingSchedulesData = viewingSchedulesResponse.data || [];
        const reviewsData = reviewsResponse.data || [];
        const verifiedPayments = verifiedPaymentsResponse.data || [];
        const pendingPaymentsData = pendingPaymentsResponse.data || [];
        const userVerifications = userVerificationsResponse.data || [];

        const totalRevenue = verifiedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const totalProfit = verifiedPayments?.reduce((sum, p) => sum + (p.amount || 0) * getCommissionRate(p.notes), 0) || 0;
        const pendingAmount = pendingPaymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        const currentMonthPayments = verifiedPayments?.filter(p => p.created_at >= currentMonthStart) || [];
        const lastMonthPayments = verifiedPayments?.filter(p => p.created_at >= lastMonthStart && p.created_at <= lastMonthEnd) || [];

        const monthlyRevenue = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const monthlyProfit = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0) * getCommissionRate(p.notes), 0);
        const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const lastMonthProfit = lastMonthPayments.reduce((sum, p) => sum + (p.amount || 0) * getCommissionRate(p.notes), 0);

        const profitGrowth = lastMonthProfit > 0 
          ? ((monthlyProfit - lastMonthProfit) / lastMonthProfit) * 100 
          : monthlyProfit > 0 ? 100 : 0;

        const chartData: MonthlyData[] = months.map(month => {
          const monthPayments = verifiedPayments?.filter(p => p.created_at >= month.start && p.created_at <= month.end) || [];
          const revenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          const profit = monthPayments.reduce((sum, p) => sum + (p.amount || 0) * getCommissionRate(p.notes), 0);
          return { month: month.label, revenue, profit };
        });

        // Region data
        const regionCounts: Record<string, { properties: number; bookings: number }> = {};
        propertiesData?.forEach(p => {
          if (p.region) {
            if (!regionCounts[p.region]) regionCounts[p.region] = { properties: 0, bookings: 0 };
            regionCounts[p.region].properties++;
          }
        });

        const topRegions = Object.entries(regionCounts)
          .sort((a, b) => b[1].properties - a[1].properties)
          .slice(0, 5)
          .map(([name, data]) => ({ name, ...data }));

        // Property type breakdown
        const typeCounts: Record<string, number> = {};
        propertiesData?.forEach(p => {
          const type = p.property_type || "Other";
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const typeColors: Record<string, string> = {
          apartment: "hsl(var(--chart-1))",
          house: "hsl(var(--chart-2))",
          commercial: "hsl(var(--chart-3))",
          land: "hsl(var(--chart-4))",
          Other: "hsl(var(--chart-5))",
        };

        const propertyTypes = Object.entries(typeCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: typeColors[name] || "hsl(var(--chart-5))",
        }));

        const usersCount = profiles.length;
        const propertiesCount = propertiesData.length;
        const availablePropertiesCount = availablePropertiesData.length;
        const rentedPropertiesCount = rentedPropertiesData.length;
        const activeLeasesCount = activeLeasesData.length;
        const serviceProvidersCount = serviceProvidersData.length;
        const approvedProvidersCount = approvedProvidersData.length;
        const pendingProvidersCount = pendingProvidersData.length;
        const vendorsCount = vendorsData.length;
        const approvedVendorsCount = approvedVendorsData.length;
        const pendingVendorsCount = pendingVendorsData.length;
        const bookingRequestsCount = bookingRequestsData.length;
        const pendingBookingsCount = bookingRequestsData.filter((b) => b.status === "pending").length;
        const approvedBookingsCount = bookingRequestsData.filter((b) => b.status === "approved").length;
        const rejectedBookingsCount = bookingRequestsData.filter((b) => ["rejected", "declined"].includes(b.status)).length;
        const viewingSchedulesCount = viewingSchedulesData.length;
        const pendingViewingsCount = viewingSchedulesData.filter((v) => v.status === "pending").length;
        const confirmedViewingsCount = viewingSchedulesData.filter((v) => v.status === "confirmed").length;
        const completedViewingsCount = viewingSchedulesData.filter((v) => v.status === "completed").length;
        const reviewsCount = reviewsData.length;
        const verifiedUsersCount = userVerifications.filter((v) => v.status === "approved").length;
        const pendingVerificationsCount = userVerifications.filter((v) => v.status === "pending").length;
        const newUsersThisMonthCount = profiles.filter((p) => p.created_at >= currentMonthStart).length;
        const newUsersLastMonthCount = profiles.filter((p) => p.created_at >= lastMonthStart && p.created_at <= lastMonthEnd).length;

        // Recent activity
        const activities: RecentActivity[] = bookingRequestsData.map((b) => ({
          id: b.created_at,
          type: "booking" as const,
          title: "Booking Request",
          description: `Status: ${b.status}`,
          time: format(new Date(b.created_at), "MMM dd, HH:mm"),
          status: b.status,
        }));

        setMonthlyData(chartData);
        setRegionData(topRegions);
        setPropertyTypeData(propertyTypes);
        setRecentActivity(activities);
        setStats({
          users: usersCount,
          properties: propertiesCount,
          availableProperties: availablePropertiesCount,
          rentedProperties: rentedPropertiesCount,
          activeLeases: activeLeasesCount,
          serviceProviders: serviceProvidersCount,
          approvedProviders: approvedProvidersCount,
          pendingProviders: pendingProvidersCount,
          vendors: vendorsCount,
          approvedVendors: approvedVendorsCount,
          pendingVendors: pendingVendorsCount,
          bookingRequests: bookingRequestsCount,
          pendingBookings: pendingBookingsCount,
          approvedBookings: approvedBookingsCount,
          rejectedBookings: rejectedBookingsCount,
          viewingSchedules: viewingSchedulesCount,
          pendingViewings: pendingViewingsCount,
          confirmedViewings: confirmedViewingsCount,
          completedViewings: completedViewingsCount,
          reviews: reviewsCount,
          totalRevenue,
          totalProfit,
          monthlyProfit,
          lastMonthProfit,
          profitGrowth,
          pendingPayments: pendingAmount,
          verifiedPayments: verifiedPayments?.length || 0,
          verifiedUsers: verifiedUsersCount,
          pendingVerifications: pendingVerificationsCount,
          newUsersThisMonth: newUsersThisMonthCount,
          newUsersLastMonth: newUsersLastMonthCount,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

// Real-time subscriptions are disabled in the REST-only frontend migration.
  // This dashboard currently refreshes on initial load and can be extended
  // with polling or SignalR-style notifications if backend support is added.
  useEffect(() => {
    return () => undefined;
  }, []);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "booking": return <Calendar className="h-4 w-4 text-blue-500" />;
      case "payment": return <DollarSign className="h-4 w-4 text-green-500" />;
      case "user": return <Users className="h-4 w-4 text-purple-500" />;
      case "viewing": return <Eye className="h-4 w-4 text-amber-500" />;
    }
  };

  const formatNotificationTime = (time: Date) => {
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return format(time, "MMM dd, HH:mm");
  };

  const userGrowth = stats?.newUsersLastMonth && stats.newUsersLastMonth > 0
    ? ((stats.newUsersThisMonth - stats.newUsersLastMonth) / stats.newUsersLastMonth) * 100
    : stats?.newUsersThisMonth ? 100 : 0;

  const bookingApprovalRate = stats?.bookingRequests && stats.bookingRequests > 0
    ? ((stats.approvedBookings / stats.bookingRequests) * 100).toFixed(1)
    : "0";

  const viewingConversionRate = stats?.viewingSchedules && stats.viewingSchedules > 0
    ? ((stats.completedViewings / stats.viewingSchedules) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Business Dashboard</h2>
          <p className="text-muted-foreground mt-2">Real-time overview of your platform performance</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Date Range Filter */}
          <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
            <div className="flex items-center gap-2">
              <Select
                value={dateRangePreset}
                onValueChange={(value: DateRangePreset) => {
                  setDateRangePreset(value);
                  if (value === "custom") {
                    setShowCustomPicker(true);
                  }
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              
              {dateRangePreset === "custom" && (
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    {format(customDateRange.from, "MMM dd")} - {format(customDateRange.to, "MMM dd")}
                  </Button>
                </PopoverTrigger>
              )}
            </div>
            
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">From</p>
                  <CalendarComponent
                    mode="single"
                    selected={customDateRange.from}
                    onSelect={(date) => date && setCustomDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">To</p>
                  <CalendarComponent
                    mode="single"
                    selected={customDateRange.to}
                    onSelect={(date) => date && setCustomDateRange(prev => ({ ...prev, to: date }))}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setShowCustomPicker(false)}
                >
                  Apply Range
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        
        {/* Notification Bell */}
        <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold">Notifications</h4>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                      Mark all read
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearNotifications} className="text-xs h-7">
                      Clear all
                    </Button>
                  </>
                )}
              </div>
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <Bell className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs">Real-time updates will appear here</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-muted/30" : ""}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatNotificationTime(notification.time)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <>
                <div className="text-2xl font-bold">${stats?.totalRevenue?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Platform profit: ${stats?.totalProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <>
                <div className="text-2xl font-bold">${stats?.monthlyProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0}</div>
                <p className={`text-xs flex items-center gap-1 ${stats?.profitGrowth && stats.profitGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {stats?.profitGrowth && stats.profitGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(stats?.profitGrowth || 0).toFixed(1)}% vs last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Revenue</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <>
                <div className="text-2xl font-bold">${stats?.pendingPayments?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting verification</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Leases</CardTitle>
            <FileCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.activeLeases || 0}</div>
                <p className="text-xs text-muted-foreground">{stats?.rentedProperties || 0} rented properties</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bookings & Viewings KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Booking Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stats?.bookingRequests || 0}</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />{stats?.pendingBookings || 0} pending
                  </Badge>
                  <Badge variant="default" className="text-xs bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />{stats?.approvedBookings || 0} approved
                  </Badge>
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" />{stats?.rejectedBookings || 0} rejected
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{bookingApprovalRate}% approval rate</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              Property Viewings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stats?.viewingSchedules || 0}</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />{stats?.pendingViewings || 0} pending
                  </Badge>
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />{stats?.confirmedViewings || 0} confirmed
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{viewingConversionRate}% completed rate</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-500" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stats?.users || 0}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    +{stats?.newUsersThisMonth || 0} this month
                  </Badge>
                  <span className={`text-xs flex items-center ${userGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {userGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(userGrowth).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{stats?.verifiedUsers || 0} verified users</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {(stats?.pendingBookings || 0) + (stats?.pendingViewings || 0) + (stats?.pendingProviders || 0) + (stats?.pendingVendors || 0) + (stats?.pendingVerifications || 0)}
                </div>
                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                  <span>{stats?.pendingVerifications || 0} verifications</span>
                  <span>•</span>
                  <span>{stats?.pendingProviders || 0} providers</span>
                  <span>•</span>
                  <span>{stats?.pendingVendors || 0} vendors</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
            <CardDescription>Last 6 months performance</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="profit" name="Profit" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Properties by Type</CardTitle>
            <CardDescription>Distribution of listings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[300px] w-full" /> : propertyTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={propertyTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {propertyTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No property data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Properties & Partners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Home className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.properties || 0}</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{stats?.availableProperties || 0} available</Badge>
                  <Badge variant="secondary" className="text-xs">{stats?.rentedProperties || 0} rented</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.serviceProviders || 0}</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="default" className="text-xs bg-green-500">{stats?.approvedProviders || 0} active</Badge>
                  <Badge variant="secondary" className="text-xs">{stats?.pendingProviders || 0} pending</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
            <Store className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.vendors || 0}</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="default" className="text-xs bg-green-500">{stats?.approvedVendors || 0} active</Badge>
                  <Badge variant="secondary" className="text-xs">{stats?.pendingVendors || 0} pending</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <UserCheck className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.reviews || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Customer feedback</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Regions */}
      {regionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Top Regions by Properties
            </CardTitle>
            <CardDescription>Geographic distribution of listings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[200px] w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="properties" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
