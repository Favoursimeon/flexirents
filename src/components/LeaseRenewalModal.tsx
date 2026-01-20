import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, addMonths } from "date-fns";
import { RefreshCw, Calendar, Home, CheckCircle2, Loader2 } from "lucide-react";

interface LeaseRenewalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lease: {
    id: string;
    property_id: string;
    monthly_rent: number;
    rent_expiration_date: string;
    lease_duration_months: number;
    properties: {
      title: string;
      location: string;
      region: string;
    } | null;
  };
  onSuccess?: () => void;
}

export function LeaseRenewalModal({ open, onOpenChange, lease, onSuccess }: LeaseRenewalModalProps) {
  const [duration, setDuration] = useState<string>("12");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const newStartDate = new Date(lease.rent_expiration_date);
      const newEndDate = addMonths(newStartDate, parseInt(duration));

      // Create a renewal request in viewing_schedules table with a special status
      // Or we can create a new table for renewal requests
      // For now, we'll use a simpler approach - create a pending lease
      const { error } = await supabase
        .from("rental_leases")
        .insert({
          property_id: lease.property_id,
          tenant_id: user.id,
          landlord_id: "00000000-0000-0000-0000-000000000000", // Will be updated by admin
          monthly_rent: lease.monthly_rent,
          lease_duration_months: parseInt(duration),
          first_payment_date: format(newStartDate, "yyyy-MM-dd"),
          lease_start_date: format(newStartDate, "yyyy-MM-dd"),
          rent_expiration_date: format(newEndDate, "yyyy-MM-dd"),
          status: "renewal_pending",
          notes: `Lease renewal request from existing lease ${lease.id}. ${notes ? `Tenant notes: ${notes}` : ""}`.trim(),
        });

      if (error) throw error;

      toast({
        title: "Renewal Request Submitted",
        description: "Your lease renewal request has been submitted. The landlord will review it shortly.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting renewal request:", error);
      toast({
        title: "Error",
        description: "Failed to submit renewal request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const newStartDate = new Date(lease.rent_expiration_date);
  const newEndDate = addMonths(newStartDate, parseInt(duration));
  const totalRent = lease.monthly_rent * parseInt(duration);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Request Lease Renewal
          </DialogTitle>
          <DialogDescription>
            Submit a renewal request for your current lease. No security deposit is required for renewals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Property Info */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{lease.properties?.title || "Property"}</h4>
                  <p className="text-sm text-muted-foreground">
                    {lease.properties?.location}, {lease.properties?.region}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Renewal Benefits */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              <strong>Renewal Benefit:</strong> No security deposit required - your existing deposit will carry over.
            </p>
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <Label htmlFor="duration">New Lease Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months (1 year)</SelectItem>
                <SelectItem value="18">18 months</SelectItem>
                <SelectItem value="24">24 months (2 years)</SelectItem>
                <SelectItem value="36">36 months (3 years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* New Lease Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">New Start Date</Label>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(newStartDate, "MMM dd, yyyy")}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">New End Date</Label>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(newEndDate, "MMM dd, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-medium text-sm">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Rent</span>
                  <span className="font-medium">{formatPrice(lease.monthly_rent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{duration} months</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Security Deposit</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                    Waived (Renewal)
                  </Badge>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-medium">Total Rent</span>
                  <span className="font-bold text-primary">{formatPrice(totalRent)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special requests or comments for your landlord..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Submit Renewal Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
