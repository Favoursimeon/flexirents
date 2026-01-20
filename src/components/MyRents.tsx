import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format, differenceInDays, isPast } from "date-fns";
import { Home, Calendar, MapPin, CreditCard, Clock, AlertCircle, CheckCircle2, FileText, RefreshCw, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { LeaseRenewalModal } from "./LeaseRenewalModal";
interface RentalLease {
  id: string;
  property_id: string;
  monthly_rent: number;
  lease_start_date: string;
  rent_expiration_date: string;
  lease_duration_months: number;
  status: string;
  created_at: string;
  properties: {
    title: string;
    location: string;
    region: string;
    images: string[] | null;
    property_type: string;
  } | null;
}

interface PaymentSummary {
  totalPaid: number;
  totalDue: number;
  nextPaymentDate: string | null;
  nextPaymentAmount: number;
}

export function MyRents() {
  const [leases, setLeases] = useState<RentalLease[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentSummaries, setPaymentSummaries] = useState<Record<string, PaymentSummary>>({});
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedLeaseForRenewal, setSelectedLeaseForRenewal] = useState<RentalLease | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  // Check if lease is eligible for renewal (within 3 months of expiry)
  const isEligibleForRenewal = (endDate: string, status: string) => {
    if (status !== "active") return false;
    const end = new Date(endDate);
    const now = new Date();
    const daysRemaining = differenceInDays(end, now);
    // Eligible if within 90 days (3 months) of expiry and not expired
    return daysRemaining <= 90 && daysRemaining > 0;
  };

  // Get days until renewal becomes eligible
  const getDaysUntilRenewalEligible = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysRemaining = differenceInDays(end, now);
    // Renewal is eligible when daysRemaining <= 90
    return Math.max(0, daysRemaining - 90);
  };

  const handleRenewalRequest = (lease: RentalLease) => {
    setSelectedLeaseForRenewal(lease);
    setRenewalModalOpen(true);
  };

  const fetchLeases = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("rental_leases")
        .select(`
          *,
          properties (
            title,
            location,
            region,
            images,
            property_type
          )
        `)
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeases(data || []);

      // Fetch payment summaries for each lease
      if (data && data.length > 0) {
        const summaries: Record<string, PaymentSummary> = {};
        
        for (const lease of data) {
          const { data: payments } = await supabase
            .from("rental_payments")
            .select("*")
            .eq("lease_id", lease.id)
            .eq("tenant_id", user.id);

          if (payments) {
            const paidPayments = payments.filter(p => p.status === "paid");
            const pendingPayments = payments.filter(p => p.status === "pending");
            const nextPending = pendingPayments.sort((a, b) => 
              new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
            )[0];

            summaries[lease.id] = {
              totalPaid: paidPayments.reduce((sum, p) => sum + Number(p.amount), 0),
              totalDue: pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0),
              nextPaymentDate: nextPending?.due_date || null,
              nextPaymentAmount: nextPending ? Number(nextPending.amount) : 0,
            };
          }
        }
        setPaymentSummaries(summaries);
      }
    } catch (error) {
      console.error("Error fetching leases:", error);
      toast({
        title: "Error",
        description: "Failed to load your rental information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeases();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "terminated":
        return <Badge variant="outline" className="text-muted-foreground">Terminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeaseProgress = (startDate: string, endDate: string, durationMonths: number) => {
    const start = new Date(startDate);
    const now = new Date();
    
    // Calculate months elapsed
    const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    
    // Include partial month progress
    const dayOfMonth = now.getDate();
    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const partialMonth = dayOfMonth / daysInCurrentMonth;
    
    const totalProgress = monthsElapsed + partialMonth;
    
    return Math.min(Math.max((totalProgress / durationMonths) * 100, 0), 100);
  };
  
  const getMonthsElapsed = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return Math.max(0, months);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const days = differenceInDays(end, now);
    return days;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (leases.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Home className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Active Rentals</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">
            You don't have any rental agreements yet. Browse available properties to find your next home.
          </p>
          <Button onClick={() => navigate('/rentals')}>
            Browse Rentals
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Get leases eligible for renewal or approaching eligibility
  const getEligibleLeases = () => {
    return leases.filter(lease => {
      if (lease.status !== "active") return false;
      const daysRemaining = getDaysRemaining(lease.rent_expiration_date);
      return daysRemaining > 0; // All active, non-expired leases
    });
  };

  const eligibleLeases = getEligibleLeases();
  const renewableNow = eligibleLeases.filter(l => isEligibleForRenewal(l.rent_expiration_date, l.status));

  return (
    <div className="space-y-6">
      {/* Lease Renewal Banner - Standalone Card */}
      {eligibleLeases.length > 0 && (
        <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/20">
                  <RefreshCw className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Lease Renewal</CardTitle>
                  <CardDescription className="text-sm">
                    {renewableNow.length > 0 
                      ? `${renewableNow.length} lease${renewableNow.length > 1 ? 's' : ''} eligible for renewal now!`
                      : "Your renewal window will open 3 months before lease expiry"
                    }
                  </CardDescription>
                </div>
              </div>
              {renewableNow.length > 0 && (
                <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm animate-pulse">
                  Action Required
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {eligibleLeases.map(lease => {
              const daysRemaining = getDaysRemaining(lease.rent_expiration_date);
              const canRenew = isEligibleForRenewal(lease.rent_expiration_date, lease.status);
              const daysUntilEligible = daysRemaining - 90;
              
              return (
                <div 
                  key={`renewal-${lease.id}`}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    canRenew 
                      ? "bg-primary/10 border-primary/40 shadow-md" 
                      : "bg-card border-border"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {lease.properties?.images?.[0] ? (
                          <img 
                            src={lease.properties.images[0]} 
                            alt={lease.properties?.title || "Property"} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold line-clamp-1">
                          {lease.properties?.title || "Property"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {canRenew ? (
                            <span className="text-primary font-medium">
                              Expires in {daysRemaining} days - Renewal available!
                            </span>
                          ) : (
                            <span>
                              Renewal available in {daysUntilEligible} days
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-shrink-0">
                      {canRenew ? (
                        <Button 
                          onClick={() => handleRenewalRequest(lease)}
                          className="w-full sm:w-auto"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Request Renewal
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground px-3 py-1.5">
                          <Clock className="h-3 w-3 mr-1" />
                          {daysUntilEligible} days until eligible
                        </Badge>
                      )}
                    </div>
                  </div>
                  {canRenew && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <p className="text-sm text-primary/80">
                        ✨ <strong>Good news!</strong> No security deposit required for renewals. Request now to secure your home!
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Rentals</p>
                <p className="text-2xl font-bold">{leases.filter(l => l.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">
                  {formatPrice(Object.values(paymentSummaries).reduce((sum, s) => sum + s.totalPaid, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-500/10 p-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold">
                  {formatPrice(Object.values(paymentSummaries).reduce((sum, s) => sum + s.totalDue, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rental Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {leases.map((lease) => {
          const summary = paymentSummaries[lease.id];
          const daysRemaining = getDaysRemaining(lease.rent_expiration_date);
          const progress = getLeaseProgress(lease.lease_start_date, lease.rent_expiration_date, lease.lease_duration_months);
          const monthsElapsed = getMonthsElapsed(lease.lease_start_date);
          const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
          const isExpired = daysRemaining <= 0;
          const canRenew = isEligibleForRenewal(lease.rent_expiration_date, lease.status);
          const daysUntilRenewalEligible = getDaysUntilRenewalEligible(lease.rent_expiration_date);

          return (
            <Card key={lease.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Property Image Header */}
              <div className="relative h-40 bg-muted">
                {lease.properties?.images?.[0] ? (
                  <img 
                    src={lease.properties.images[0]} 
                    alt={lease.properties?.title || "Property"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                    <Home className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(lease.status)}
                </div>
                {isExpiringSoon && !isExpired && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-amber-500 text-white">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Expiring Soon
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-5 space-y-4">
                {/* Property Info with Renewal Button */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {lease.properties?.title || "Property"}
                    </h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {lease.properties?.location}, {lease.properties?.region}
                      </span>
                    </div>
                  </div>
                  
                  {/* Renewal Button - Right Side */}
                  {lease.status === "active" && (
                    <div className="flex-shrink-0">
                      {canRenew ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedLeaseForRenewal(lease);
                            setRenewalModalOpen(true);
                          }}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Renew
                        </Button>
                      ) : (
                        <div className="text-right">
                          <Button size="sm" variant="outline" disabled className="opacity-60">
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Renew
                          </Button>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            In {daysUntilRenewalEligible} days
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Lease Duration Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lease Progress</span>
                    <span className="font-medium">
                      {isExpired 
                        ? "Expired" 
                        : `${Math.min(monthsElapsed, lease.lease_duration_months)} of ${lease.lease_duration_months} months`
                      }
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{format(new Date(lease.lease_start_date), "MMM yyyy")}</span>
                    <span>{format(new Date(lease.rent_expiration_date), "MMM yyyy")}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                    <p className="font-semibold text-primary">
                      {formatPrice(lease.monthly_rent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Next Payment</p>
                    {summary?.nextPaymentDate ? (
                      <p className="font-medium">
                        {format(new Date(summary.nextPaymentDate), "MMM dd")}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-sm">No pending</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/property/${lease.property_id}`)}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    View Property
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate('/profile', { state: { activePanel: 'billing' } })}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Payments
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lease Renewal Modal */}
      {selectedLeaseForRenewal && (
        <LeaseRenewalModal
          open={renewalModalOpen}
          onOpenChange={setRenewalModalOpen}
          lease={selectedLeaseForRenewal}
          onSuccess={fetchLeases}
        />
      )}
    </div>
  );
}
