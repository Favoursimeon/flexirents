import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Home, Briefcase, Store, Calendar, MessageSquare, TrendingUp, DollarSign, Percent, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface Stats {
  users: number;
  properties: number;
  availableProperties: number;
  activeLeases: number;
  serviceProviders: number;
  vendors: number;
  bookings: number;
  reviews: number;
  totalRevenue: number;
  totalProfit: number;
  monthlyProfit: number;
  lastMonthProfit: number;
  profitGrowth: number;
  pendingPayments: number;
  verifiedPayments: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  profit: number;
}

interface PaymentTypeData {
  name: string;
  value: number;
  color: string;
}

const COMMISSION_RATE = 0.10; // 10% platform commission

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [paymentTypeData, setPaymentTypeData] = useState<PaymentTypeData[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get the last 6 months for chart data
        const months = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), 5 - i);
          return {
            start: startOfMonth(date).toISOString(),
            end: endOfMonth(date).toISOString(),
            label: format(date, "MMM"),
          };
        });

        const [
          { count: usersCount },
          { count: propertiesCount },
          { count: availablePropertiesCount },
          { count: activeLeasesCount },
          { count: serviceProvidersCount },
          { count: vendorsCount },
          { count: bookingsCount },
          { count: reviewsCount },
          { data: verifiedPayments },
          { data: pendingPaymentsData },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("properties").select("*", { count: "exact", head: true }),
          supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "available"),
          supabase.from("rental_leases").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("service_provider_registrations").select("*", { count: "exact", head: true }),
          supabase.from("vendor_registrations").select("*", { count: "exact", head: true }),
          supabase.from("bookings").select("*", { count: "exact", head: true }),
          supabase.from("reviews").select("*", { count: "exact", head: true }),
          supabase.from("rental_payments").select("amount, payment_type, created_at").eq("verification_status", "verified"),
          supabase.from("rental_payments").select("amount").eq("verification_status", "unverified").eq("status", "pending"),
        ]);

        const totalRevenue = verifiedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const totalProfit = totalRevenue * COMMISSION_RATE;
        const pendingAmount = pendingPaymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Calculate monthly profit
        const currentMonthStart = startOfMonth(new Date()).toISOString();
        const lastMonthStart = startOfMonth(subMonths(new Date(), 1)).toISOString();
        const lastMonthEnd = endOfMonth(subMonths(new Date(), 1)).toISOString();

        const currentMonthPayments = verifiedPayments?.filter(
          p => p.created_at >= currentMonthStart
        ) || [];
        const lastMonthPayments = verifiedPayments?.filter(
          p => p.created_at >= lastMonthStart && p.created_at <= lastMonthEnd
        ) || [];

        const monthlyRevenue = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const monthlyProfit = monthlyRevenue * COMMISSION_RATE;
        const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const lastMonthProfit = lastMonthRevenue * COMMISSION_RATE;

        const profitGrowth = lastMonthProfit > 0 
          ? ((monthlyProfit - lastMonthProfit) / lastMonthProfit) * 100 
          : monthlyProfit > 0 ? 100 : 0;

        // Calculate monthly chart data
        const chartData: MonthlyData[] = months.map(month => {
          const monthPayments = verifiedPayments?.filter(
            p => p.created_at >= month.start && p.created_at <= month.end
          ) || [];
          const revenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          return {
            month: month.label,
            revenue,
            profit: revenue * COMMISSION_RATE,
          };
        });

        // Calculate payment type breakdown
        const paymentsByType: Record<string, number> = {};
        verifiedPayments?.forEach(p => {
          const type = p.payment_type || "rental";
          paymentsByType[type] = (paymentsByType[type] || 0) + (p.amount || 0) * COMMISSION_RATE;
        });

        const typeColors: Record<string, string> = {
          rental: "hsl(var(--chart-1))",
          deposit: "hsl(var(--chart-2))",
          service: "hsl(var(--chart-3))",
          other: "hsl(var(--chart-4))",
        };

        const pieData: PaymentTypeData[] = Object.entries(paymentsByType).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: typeColors[name] || "hsl(var(--chart-5))",
        }));

        setMonthlyData(chartData);
        setPaymentTypeData(pieData);
        setStats({
          users: usersCount || 0,
          properties: propertiesCount || 0,
          availableProperties: availablePropertiesCount || 0,
          activeLeases: activeLeasesCount || 0,
          serviceProviders: serviceProvidersCount || 0,
          vendors: vendorsCount || 0,
          bookings: bookingsCount || 0,
          reviews: reviewsCount || 0,
          totalRevenue,
          totalProfit,
          monthlyProfit,
          lastMonthProfit,
          profitGrowth,
          pendingPayments: pendingAmount,
          verifiedPayments: verifiedPayments?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const profitCards = [
    { 
      title: "Total Profit", 
      value: stats?.totalProfit ? `$${stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00", 
      subtitle: `${COMMISSION_RATE * 100}% of $${stats?.totalRevenue?.toLocaleString() || 0} revenue`,
      icon: DollarSign, 
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    { 
      title: "This Month", 
      value: stats?.monthlyProfit ? `$${stats.monthlyProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00", 
      subtitle: stats?.profitGrowth !== undefined ? (
        <span className={`flex items-center gap-1 ${stats.profitGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
          {stats.profitGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(stats.profitGrowth).toFixed(1)}% vs last month
        </span>
      ) : null,
      icon: TrendingUp, 
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    { 
      title: "Pending Revenue", 
      value: stats?.pendingPayments ? `$${stats.pendingPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00", 
      subtitle: "Awaiting verification",
      icon: Percent, 
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
  ];

  const statCards = [
    { title: "Active Leases", value: stats?.activeLeases, icon: Home, color: "text-blue-500" },
    { title: "Available Properties", value: stats?.availableProperties, icon: Home, color: "text-emerald-500" },
    { title: "Total Users", value: stats?.users, icon: Users, color: "text-blue-500" },
    { title: "Service Providers", value: stats?.serviceProviders, icon: Briefcase, color: "text-purple-500" },
    { title: "Vendors", value: stats?.vendors, icon: Store, color: "text-orange-500" },
    { title: "Bookings", value: stats?.bookings, icon: Calendar, color: "text-pink-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Welcome to Admin Dashboard</h2>
        <p className="text-muted-foreground mt-2">Manage and monitor your platform</p>
      </div>

      {/* Profit Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {profitCards.map((card) => (
          <Card key={card.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Profit Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
            <CardDescription>Last 6 months performance</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
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
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="hsl(var(--chart-2))"
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Profit by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Profit by Type</CardTitle>
            <CardDescription>Breakdown by payment category</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : paymentTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No payment data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Other Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
