import { useEffect, useState } from "react";
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
import api from "@/lib/api";

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
  const [selectedLease, setSelectedLease] = useState<RentalLease | null>(null);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeases = async () => {
      if (!user) return;
      try {
        const { data } = await api.get('/api/bookings');
        setLeases(data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load rentals.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeases();
  }, [user]);

  const getLeaseProgress = (lease: RentalLease) => {
    const start = new Date(lease.lease_start_date);
    const end = new Date(lease.rent_expiration_date);
    const now = new Date();
    const total = differenceInDays(end, start);
    const elapsed = differenceInDays(now, start);
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const getDaysRemaining = (expirationDate: string) => {
    return differenceInDays(new Date(expirationDate), new Date());
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Rentals</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Rentals</h2>
        {leases.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              You have no active rentals.
            </CardContent>
          </Card>
        ) : (
          leases.map((lease) => {
            const daysRemaining = getDaysRemaining(lease.rent_expiration_date);
            const isExpired = isPast(new Date(lease.rent_expiration_date));
            const progress = getLeaseProgress(lease);

            return (
              <Card key={lease.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {lease.properties?.title || "Property"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {lease.properties?.location}
                      </CardDescription>
                    </div>
                    <Badge variant={isExpired ? "destructive" : daysRemaining < 30 ? "secondary" : "default"}>
                      {isExpired ? "Expired" : lease.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Start: {format(new Date(lease.lease_start_date), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Ends: {format(new Date(lease.rent_expiration_date), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>{formatPrice(lease.monthly_rent)}/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpired ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <span>{isExpired ? "Expired" : `${daysRemaining} days remaining`}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Lease progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/property/${lease.property_id}`)}>
                      <Home className="h-4 w-4 mr-1" /> View Property
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedLease(lease); setRenewalModalOpen(true); }}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Renew Lease
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      {selectedLease && (
        <LeaseRenewalModal
          lease={selectedLease}
          open={renewalModalOpen}
          onOpenChange={setRenewalModalOpen}
        />
      )}
    </>
  );
}