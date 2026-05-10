import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Bell, ShieldCheck, Home, TrendingUp, Calendar, Award, Heart, FileText, DollarSign, Star, Package, CreditCard, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CreditScoreHistoryChart } from "@/components/CreditScoreHistoryChart";
import { CreditScoreImprovementTips } from "@/components/CreditScoreImprovementTips";
import { PaymentReminderSettings } from "@/components/PaymentReminderSettings";
import { PaymentCalendar } from "@/components/PaymentCalendar";
import { PaymentAccountManager } from "@/components/PaymentAccountManager";
import { RecurringPaymentScheduler } from "@/components/RecurringPaymentScheduler";
import { PaymentHistoryExport } from "@/components/PaymentHistoryExport";
import { usePaymentReminders } from "@/hooks/usePaymentReminders";
import api from "@/lib/api";

interface PaymentRecord {
  id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: string;
}

interface CreditScore {
  score: number;
  rating: "Excellent" | "Good" | "Fair" | "Poor" | "No History";
  onTimePayments: number;
  latePayments: number;
  missedPayments: number;
  totalPayments: number;
  paymentHistory: PaymentRecord[];
}

interface DashboardStats {
  verificationStatus: string;
  propertyAlertsEnabled: boolean;
  totalBookings: number;
  activeListings: number;
  activityScore: number;
  wishlistCount: number;
  activeLeases: number;
  pendingPayments: number;
  reviewsReceived: number;
  averageRating: number;
  bookingRequests: number;
  productsListed: number;
  userRole: string | null;
  creditScore: CreditScore | null;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  usePaymentReminders();

  useEffect(() => {
    if (user) fetchDashboardStats();
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/api/users/dashboard-stats');

      const paymentHistory: PaymentRecord[] = data?.paymentHistory || [];
      let creditScore: CreditScore;

      if (paymentHistory.length > 0) {
        let onTimePayments = 0, latePayments = 0, missedPayments = 0;
        paymentHistory.forEach((payment) => {
          if (payment.status === 'paid' || payment.status === 'verified') {
            if (payment.payment_date && payment.due_date) {
              const daysLate = differenceInDays(new Date(payment.payment_date), new Date(payment.due_date));
              if (daysLate <= 0) onTimePayments++;
              else if (daysLate <= 30) latePayments++;
              else missedPayments++;
            } else onTimePayments++;
          } else if (payment.status === 'overdue') {
            const daysOverdue = differenceInDays(new Date(), new Date(payment.due_date));
            if (daysOverdue > 30) missedPayments++;
            else latePayments++;
          }
        });
        let score = 550;
        score += Math.min(onTimePayments * 10, 150);
        score -= latePayments * 15;
        score -= missedPayments * 30;
        score = Math.max(300, Math.min(850, score));
        let rating: CreditScore["rating"];
        if (score >= 750) rating = "Excellent";
        else if (score >= 670) rating = "Good";
        else if (score >= 580) rating = "Fair";
        else rating = "Poor";
        creditScore = { score, rating, onTimePayments, latePayments, missedPayments, totalPayments: onTimePayments + latePayments + missedPayments, paymentHistory };
      } else {
        creditScore = { score: 0, rating: "No History", onTimePayments: 0, latePayments: 0, missedPayments: 0, totalPayments: 0, paymentHistory: [] };
      }

      setStats({
        verificationStatus: data?.verificationStatus || "not_verified",
        propertyAlertsEnabled: data?.propertyAlertsEnabled || false,
        totalBookings: data?.totalBookings || 0,
        activeListings: data?.activeListings || 0,
        activityScore: data?.activityScore || 0,
        wishlistCount: data?.wishlistCount || 0,
        activeLeases: data?.activeLeases || 0,
        pendingPayments: data?.pendingPayments || 0,
        reviewsReceived: data?.reviewsReceived || 0,
        averageRating: data?.averageRating || 0,
        bookingRequests: data?.bookingRequests || 0,
        productsListed: data?.productsListed || 0,
        userRole: data?.userRole || null,
        creditScore,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStats({
        verificationStatus: "not_verified",
        propertyAlertsEnabled: false,
        totalBookings: 0,
        activeListings: 0,
        activityScore: 0,
        wishlistCount: 0,
        activeLeases: 0,
        pendingPayments: 0,
        reviewsReceived: 0,
        averageRating: 0,
        bookingRequests: 0,
        productsListed: 0,
        userRole: null,
        creditScore: { score: 0, rating: "No History", onTimePayments: 0, latePayments: 0, missedPayments: 0, totalPayments: 0, paymentHistory: [] },
      });
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "text-green-500";
      case "pending": return "text-yellow-500";
      case "rejected": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  const getVerificationStatusText = (status: string) => {
    switch (status) {
      case "verified": return "Verified";
      case "pending": return "Pending Review";
      case "rejected": return "Rejected";
      default: return "Not Verified";
    }
  };

  const getActivityLevel = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-500" };
    if (score >= 60) return { label: "Very Active", color: "text-blue-500" };
    if (score >= 40) return { label: "Active", color: "text-yellow-500" };
    if (score >= 20) return { label: "Getting Started", color: "text-orange-500" };
    return { label: "New Member", color: "text-muted-foreground" };
  };

  const getCreditScoreColor = (rating: CreditScore["rating"]) => {
    switch (rating) {
      case "Excellent": return "text-green-500";
      case "Good": return "text-blue-500";
      case "Fair": return "text-yellow-500";
      case "Poor": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  const getCreditScoreProgress = (score: number) => {
    if (score === 0) return 0;
    return ((score - 300) / 550) * 100;
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

  const activityLevel = getActivityLevel(stats?.activityScore || 0);

  const statCards = [
    { title: "Verification Status", value: getVerificationStatusText(stats?.verificationStatus || "not_verified"), icon: ShieldCheck, color: getVerificationStatusColor(stats?.verificationStatus || "not_verified"), description: "Account verification" },
    { title: "Property Alerts", value: stats?.propertyAlertsEnabled ? "Active" : "Paused", icon: Bell, color: stats?.propertyAlertsEnabled ? "text-green-500" : "text-muted-foreground", description: "Notification preferences" },
    { title: "Wishlist Items", value: stats?.wishlistCount || 0, icon: Heart, color: "text-pink-500", description: "Saved properties" },
    { title: "Active Leases", value: stats?.activeLeases || 0, icon: FileText, color: "text-green-500", description: "Current rentals" },
    { title: "Pending Payments", value: stats?.pendingPayments || 0, icon: DollarSign, color: (stats?.pendingPayments || 0) > 0 ? "text-red-500" : "text-muted-foreground", description: "Due payments" },
    { title: "Total Bookings", value: stats?.totalBookings || 0, icon: Calendar, color: "text-blue-500", description: "Service bookings" },
    { title: "Properties Listed", value: stats?.activeListings || 0, icon: Home, color: "text-purple-500", description: "Your listings" },
    { title: "Activity Score", value: `${stats?.activityScore || 0}/100`, icon: Award, color: activityLevel.color, description: activityLevel.label },
  ];

  return (
    <div className="space-y-6">
      {stats?.creditScore && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Credit Score</CardTitle>
            <CardDescription>Based on your rental payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center justify-center p-6 bg-background rounded-lg border">
                {stats.creditScore.rating === "No History" ? (
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-lg font-medium text-muted-foreground">No Payment History</p>
                    <p className="text-sm text-muted-foreground mt-1">Make rental payments to build your credit score</p>
                  </div>
                ) : (
                  <>
                    <div className={`text-5xl font-bold ${getCreditScoreColor(stats.creditScore.rating)}`}>{stats.creditScore.score}</div>
                    <Badge variant="secondary" className={`mt-2 ${getCreditScoreColor(stats.creditScore.rating)}`}>{stats.creditScore.rating}</Badge>
                    <div className="w-full mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>300</span><span>850</span></div>
                      <Progress value={getCreditScoreProgress(stats.creditScore.score)} className="h-2" />
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Payment History Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-sm">On-Time Payments</span></div>
                    <span className="font-bold text-green-500">{stats.creditScore.onTimePayments}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-500" /><span className="text-sm">Late Payments (1-30 days)</span></div>
                    <span className="font-bold text-yellow-500">{stats.creditScore.latePayments}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                    <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /><span className="text-sm">Missed Payments (30+ days)</span></div>
                    <span className="font-bold text-red-500">{stats.creditScore.missedPayments}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Total tracked payments: {stats.creditScore.totalPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {stats?.creditScore && stats.creditScore.paymentHistory.length > 0 && <CreditScoreHistoryChart paymentHistory={stats.creditScore.paymentHistory} />}
      {stats?.creditScore && <CreditScoreImprovementTips score={stats.creditScore.score} rating={stats.creditScore.rating} onTimePayments={stats.creditScore.onTimePayments} latePayments={stats.creditScore.latePayments} missedPayments={stats.creditScore.missedPayments} totalPayments={stats.creditScore.totalPayments} paymentHistory={stats.creditScore.paymentHistory} />}
      {stats?.creditScore && stats.creditScore.paymentHistory.length > 0 && <PaymentCalendar payments={stats.creditScore.paymentHistory} />}
      {stats?.creditScore && stats.creditScore.totalPayments > 0 && <PaymentReminderSettings />}
      <PaymentAccountManager />
      <RecurringPaymentScheduler />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <PaymentHistoryExport />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>No recent activity to display.</p>
            <p className="mt-2">Your bookings, property interactions, and account updates will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}