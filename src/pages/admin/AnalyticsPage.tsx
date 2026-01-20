import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Home, Calendar, DollarSign, Download, FileText, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useRealtimeVisitors } from "@/hooks/useVisitorTracking";

interface MonthlyData {
  month: string;
  revenue: number;
  bookings: number;
  users: number;
  properties: number;
}

interface CategoryData {
  name: string;
  value: number;
}

type TractionMetricKey = "visitors" | "pageviews" | "viewsPerVisit" | "visitDuration" | "bounceRate";

interface TractionTimeSeriesData {
  date: string;
  value: number;
}

interface TractionListData {
  label: string;
  value: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    activeProperties: 0,
    completedBookings: 0,
    activeUsers: 0,
    growthRate: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [serviceCategories, setServiceCategories] = useState<CategoryData[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  // Traction state
  const [selectedTractionMetric, setSelectedTractionMetric] = useState<TractionMetricKey>("pageviews");
  const [tractionDateRange, setTractionDateRange] = useState("7d");
  const { currentVisitors } = useRealtimeVisitors();

  const revenueChartRef = useRef<HTMLDivElement>(null);
  const bookingsChartRef = useRef<HTMLDivElement>(null);
  const growthChartRef = useRef<HTMLDivElement>(null);
  const distributionChartRef = useRef<HTMLDivElement>(null);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

  const getTractionDateRange = () => {
    const end = new Date();
    let start: Date;
    
    switch (tractionDateRange) {
      case "24h":
        start = subDays(end, 1);
        break;
      case "7d":
        start = subDays(end, 7);
        break;
      case "30d":
        start = subMonths(end, 1);
        break;
      case "90d":
        start = subMonths(end, 3);
        break;
      default:
        start = subDays(end, 7);
    }
    
    return { start, end };
  };

  const { data: tractionData, isLoading: tractionLoading } = useQuery({
    queryKey: ["traction", tractionDateRange],
    queryFn: async () => {
      const { start, end } = getTractionDateRange();
      
      const { data: pageVisits, error: visitsError } = await supabase
        .from("page_visits")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (visitsError) throw visitsError;

      const days: TractionTimeSeriesData[] = [];
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= daysDiff; i++) {
        const date = subDays(end, daysDiff - i);
        const dateStr = format(date, "yyyy-MM-dd");
        
        const dayVisits = pageVisits?.filter(v => 
          format(new Date(v.created_at), "yyyy-MM-dd") === dateStr
        ) || [];
        
        const uniqueSessions = new Set(dayVisits.map(v => v.session_id));
        
        days.push({
          date: format(date, "d MMM"),
          value: uniqueSessions.size,
        });
      }

      const uniqueSessions = new Set(pageVisits?.map(v => v.session_id) || []);
      const totalVisitors = uniqueSessions.size;
      const totalPageviews = pageVisits?.length || 0;
      const viewsPerVisit = totalVisitors > 0 ? (totalPageviews / totalVisitors).toFixed(2) : "0";
      
      const sessionsWithDuration = pageVisits?.filter(v => v.ended_at) || [];
      let avgDuration = 0;
      if (sessionsWithDuration.length > 0) {
        const totalDuration = sessionsWithDuration.reduce((sum, v) => {
          const start = new Date(v.created_at).getTime();
          const end = new Date(v.ended_at!).getTime();
          return sum + (end - start) / 1000;
        }, 0);
        avgDuration = Math.floor(totalDuration / sessionsWithDuration.length);
      }

      const sessionPageCounts: Record<string, number> = {};
      pageVisits?.forEach(v => {
        sessionPageCounts[v.session_id] = (sessionPageCounts[v.session_id] || 0) + 1;
      });
      const singlePageSessions = Object.values(sessionPageCounts).filter(count => count === 1).length;
      const bounceRate = totalVisitors > 0 ? Math.floor((singlePageSessions / totalVisitors) * 100) : 0;

      const sourceCounts: Record<string, number> = {};
      const pageCounts: Record<string, number> = {};
      const deviceCounts: Record<string, number> = {};
      const countryCounts: Record<string, number> = {};

      pageVisits?.forEach(v => {
        const source = v.source || "direct";
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        
        pageCounts[v.page_path] = (pageCounts[v.page_path] || 0) + 1;
        
        const device = v.device_type || "unknown";
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
        
        const country = v.country || "Unknown";
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });

      const sources: TractionListData[] = Object.entries(sourceCounts)
        .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }))
        .sort((a, b) => b.value - a.value);

      const pages: TractionListData[] = Object.entries(pageCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const countries: TractionListData[] = Object.entries(countryCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const devices: TractionListData[] = Object.entries(deviceCounts)
        .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }))
        .sort((a, b) => b.value - a.value);

      const pageviewDays = [];
      for (let i = 0; i <= daysDiff; i++) {
        const date = subDays(end, daysDiff - i);
        const dateStr = format(date, "yyyy-MM-dd");
        
        const dayPageviews = pageVisits?.filter(v => 
          format(new Date(v.created_at), "yyyy-MM-dd") === dateStr
        ).length || 0;
        
        pageviewDays.push({
          date: format(date, "d MMM"),
          value: dayPageviews,
        });
      }

      return {
        metrics: {
          visitors: totalVisitors,
          pageviews: totalPageviews,
          viewsPerVisit: parseFloat(viewsPerVisit),
          visitDuration: avgDuration,
          bounceRate: Math.min(bounceRate, 100),
        },
        timeSeries: {
          visitors: days,
          pageviews: pageviewDays,
          viewsPerVisit: days.map((d, i) => ({ 
            ...d, 
            value: d.value > 0 ? parseFloat((pageviewDays[i].value / d.value).toFixed(2)) : 0 
          })),
          visitDuration: days.map(d => ({ ...d, value: d.value > 0 ? avgDuration : 0 })),
          bounceRate: days.map(d => ({ ...d, value: d.value > 0 ? bounceRate : 0 })),
        },
        lists: {
          sources,
          pages,
          countries,
          devices,
        },
      };
    },
  });

  const tractionMetrics = [
    { key: "visitors" as TractionMetricKey, label: "Visitors", value: tractionData?.metrics.visitors || 0 },
    { key: "pageviews" as TractionMetricKey, label: "Pageviews", value: tractionData?.metrics.pageviews || 0 },
    { key: "viewsPerVisit" as TractionMetricKey, label: "Views/Visit", value: tractionData?.metrics.viewsPerVisit || 0 },
    { key: "visitDuration" as TractionMetricKey, label: "Duration", value: `${tractionData?.metrics.visitDuration || 0}s` },
    { key: "bounceRate" as TractionMetricKey, label: "Bounce", value: `${tractionData?.metrics.bounceRate || 0}%` },
  ];

  const dateRangeOptions = [
    { value: "24h", label: "24h" },
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
  ];

  const renderBarList = (title: string, data: TractionListData[], showPercentage = false) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-foreground">{title}</span>
            <span className="text-sm text-muted-foreground">
              {showPercentage ? "%" : "Visitors"}
            </span>
          </div>
          <div className="space-y-3">
            {data.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data available</p>
            ) : (
              data.map((item, index) => (
                <div key={index} className="relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/20 rounded"
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                  <div className="relative flex justify-between items-center py-2 px-3">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-foreground">
                      {showPercentage 
                        ? `${total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%`
                        : item.value
                      }
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch overall stats
        const [
          { count: usersCount },
          { count: propertiesCount },
          { count: completedBookingsCount },
          { data: allBookings },
          { data: allUsers },
          { data: allProperties },
          { data: serviceProviders },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "available"),
          supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "completed"),
          supabase.from("bookings").select("created_at, status, total_hours"),
          supabase.from("profiles").select("created_at"),
          supabase.from("properties").select("created_at, property_type"),
          supabase.from("service_provider_registrations").select("service_category").eq("status", "approved"),
        ]);

        // Calculate monthly trends for the last 6 months
        const months: MonthlyData[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          const monthStart = startOfMonth(date);
          const monthEnd = endOfMonth(date);
          
          const monthBookings = allBookings?.filter(b => {
            const bookingDate = new Date(b.created_at);
            return bookingDate >= monthStart && bookingDate <= monthEnd;
          }) || [];

          const monthUsers = allUsers?.filter(u => {
            const userDate = new Date(u.created_at);
            return userDate >= monthStart && userDate <= monthEnd;
          }) || [];

          const monthProperties = allProperties?.filter(p => {
            const propDate = new Date(p.created_at);
            return propDate >= monthStart && propDate <= monthEnd;
          }) || [];

          months.push({
            month: format(date, 'MMM yyyy'),
            revenue: monthBookings.reduce((sum, b) => sum + (b.total_hours * 50), 0),
            bookings: monthBookings.length,
            users: monthUsers.length,
            properties: monthProperties.length,
          });
        }
        setMonthlyData(months);

        // Service categories distribution
        const categoryMap = new Map<string, number>();
        serviceProviders?.forEach(sp => {
          categoryMap.set(sp.service_category, (categoryMap.get(sp.service_category) || 0) + 1);
        });
        setServiceCategories(
          Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))
        );

        // Property types distribution
        const typeMap = new Map<string, number>();
        allProperties?.forEach(prop => {
          typeMap.set(prop.property_type, (typeMap.get(prop.property_type) || 0) + 1);
        });
        setPropertyTypes(
          Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }))
        );

        setAnalytics({
          totalRevenue: (completedBookingsCount || 0) * 150,
          activeProperties: propertiesCount || 0,
          completedBookings: completedBookingsCount || 0,
          activeUsers: usersCount || 0,
          growthRate: 12.5,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const exportToCSV = () => {
    try {
      // Create CSV content
      let csvContent = "Analytics Report\n\n";
      
      // Summary stats
      csvContent += "Summary Statistics\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Revenue,$${analytics.totalRevenue.toLocaleString()}\n`;
      csvContent += `Active Properties,${analytics.activeProperties}\n`;
      csvContent += `Completed Bookings,${analytics.completedBookings}\n`;
      csvContent += `Active Users,${analytics.activeUsers}\n`;
      csvContent += `Growth Rate,${analytics.growthRate}%\n\n`;

      // Monthly data
      csvContent += "Monthly Trends\n";
      csvContent += "Month,Revenue ($),Bookings,New Users,New Properties\n";
      monthlyData.forEach(row => {
        csvContent += `${row.month},${row.revenue},${row.bookings},${row.users},${row.properties}\n`;
      });
      csvContent += "\n";

      // Service categories
      csvContent += "Service Categories Distribution\n";
      csvContent += "Category,Count\n";
      serviceCategories.forEach(cat => {
        csvContent += `${cat.name},${cat.value}\n`;
      });
      csvContent += "\n";

      // Property types
      csvContent += "Property Types Distribution\n";
      csvContent += "Type,Count\n";
      propertyTypes.forEach(type => {
        csvContent += `${type.name},${type.value}\n`;
      });

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `analytics-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "CSV report has been downloaded",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export CSV report",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(33, 37, 41);
      pdf.text("Analytics Report", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(108, 117, 125);
      pdf.text(`Generated on ${format(new Date(), "MMMM dd, yyyy")}`, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;

      // Summary stats table
      pdf.setFontSize(14);
      pdf.setTextColor(33, 37, 41);
      pdf.text("Summary Statistics", 14, yPosition);
      yPosition += 5;

      autoTable(pdf, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: [
          ["Total Revenue", `$${analytics.totalRevenue.toLocaleString()}`],
          ["Active Properties", analytics.activeProperties.toString()],
          ["Completed Bookings", analytics.completedBookings.toString()],
          ["Active Users", analytics.activeUsers.toString()],
          ["Growth Rate", `${analytics.growthRate}%`],
        ],
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;

      // Monthly trends table
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text("Monthly Trends", 14, yPosition);
      yPosition += 5;

      autoTable(pdf, {
        startY: yPosition,
        head: [["Month", "Revenue ($)", "Bookings", "New Users", "New Properties"]],
        body: monthlyData.map(row => [
          row.month,
          row.revenue.toString(),
          row.bookings.toString(),
          row.users.toString(),
          row.properties.toString(),
        ]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;

      // Capture and add charts
      const captureChart = async (ref: React.RefObject<HTMLDivElement>, title: string) => {
        if (!ref.current) return;
        
        const canvas = await html2canvas(ref.current, {
          scale: 2,
          backgroundColor: "#ffffff",
        });
        
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 28;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (yPosition + imgHeight + 10 > 280) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text(title, 14, yPosition);
        yPosition += 5;
        
        pdf.addImage(imgData, "PNG", 14, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
      };

      // Add charts to PDF
      if (revenueChartRef.current) {
        await captureChart(revenueChartRef, "Revenue Trends");
      }
      
      if (bookingsChartRef.current) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        await captureChart(bookingsChartRef, "Booking Patterns");
      }

      if (growthChartRef.current) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        await captureChart(growthChartRef, "User & Property Growth");
      }

      // Distribution data
      pdf.addPage();
      yPosition = 20;

      pdf.setFontSize(14);
      pdf.text("Service Categories Distribution", 14, yPosition);
      yPosition += 5;

      autoTable(pdf, {
        startY: yPosition,
        head: [["Category", "Count"]],
        body: serviceCategories.map(cat => [cat.name, cat.value.toString()]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;

      pdf.text("Property Types Distribution", 14, yPosition);
      yPosition += 5;

      autoTable(pdf, {
        startY: yPosition,
        head: [["Type", "Count"]],
        body: propertyTypes.map(type => [type.name, type.value.toString()]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Save PDF
      pdf.save(`analytics-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);

      toast({
        title: "Export Successful",
        description: "PDF report has been downloaded",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF report",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${analytics.totalRevenue.toLocaleString()}`,
      icon: BarChart3,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Active Properties",
      value: analytics.activeProperties,
      icon: Home,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Completed Bookings",
      value: analytics.completedBookings,
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      title: "Active Users",
      value: analytics.activeUsers,
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Growth Rate",
      value: `+${analytics.growthRate}%`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-2">Track platform performance and insights</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={loading || exporting} className="gap-2">
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export Report"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exportToCSV} className="gap-2">
              <FileText className="h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="traction" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="traction">Traction</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        {/* Traction Tab */}
        <TabsContent value="traction" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${currentVisitors > 0 ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
                {currentVisitors} current visitor{currentVisitors !== 1 ? "s" : ""}
              </span>
            </div>
            <Select value={tractionDateRange} onValueChange={setTractionDateRange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Traction Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {tractionMetrics.map((metric) => (
              <Card
                key={metric.key}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedTractionMetric === metric.key
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground"
                }`}
                onClick={() => setSelectedTractionMetric(metric.key)}
              >
                <CardContent className="p-4">
                  <p className={`text-sm ${
                    selectedTractionMetric === metric.key ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {metric.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Traction Chart */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              {tractionLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={tractionData?.timeSeries[selectedTractionMetric] || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTractionValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      dx={-10}
                      domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#colorTractionValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Traction Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderBarList("Source", tractionData?.lists.sources || [])}
            {renderBarList("Page", tractionData?.lists.pages || [])}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderBarList("Country", tractionData?.lists.countries || [])}
            {renderBarList("Device", tractionData?.lists.devices || [], true)}
          </div>
        </TabsContent>

        {/* Revenue Trends */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Revenue Over Time
              </CardTitle>
            </CardHeader>
            <CardContent ref={revenueChartRef}>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)"
                      name="Revenue ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Patterns */}
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Booking Patterns
              </CardTitle>
            </CardHeader>
            <CardContent ref={bookingsChartRef}>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Bar dataKey="bookings" fill="hsl(var(--primary))" name="Total Bookings" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Growth */}
        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                User & Property Growth
              </CardTitle>
            </CardHeader>
            <CardContent ref={growthChartRef}>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="New Users"
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="properties" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      name="New Properties"
                      dot={{ fill: 'hsl(var(--accent))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" ref={distributionChartRef}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  Service Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={serviceCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {serviceCategories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  Property Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={propertyTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {propertyTypes.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
