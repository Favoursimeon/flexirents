import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Plus, Minus, CreditCard, Smartphone, AlertCircle } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { type, property, service, paymentId } = location.state || {};

  const [duration, setDuration] = useState(12);
  const [hours, setHours] = useState(8);
  const [paymentPlan, setPaymentPlan] = useState<"full" | "flexi75" | "flexi50">("flexi50");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile">("card");
  const [mobileProvider, setMobileProvider] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdPaymentId, setCreatedPaymentId] = useState<string | null>(null);
  const [calculations, setCalculations] = useState({
    baseAmount: 0,
    commission: 0,
    total: 0,
    securityDeposit: 0,
  });

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    } else if (type === "rental" && property) {
      const monthlyRent = parseFloat(property.price.replace(/[^0-9.-]+/g, ""));
      
      // Calculate full rent: monthlyRent × number of months
      const fullRent = monthlyRent * duration;
      
      // Security deposit is always 1 month's rent
      const securityDeposit = monthlyRent;
      
      if (paymentPlan === "full") {
        // Full Payment Plan: 100% upfront at 8% commission
        const commission = fullRent * 0.08;
        const upfrontPayment = fullRent; // 100%
        const totalDueNow = upfrontPayment + securityDeposit + commission;
        
        setCalculations({
          baseAmount: fullRent,
          commission,
          total: totalDueNow,
          securityDeposit,
        });
      } else if (paymentPlan === "flexi75") {
        // Flexi75 Plan: 75% upfront at 10% commission
        const commission = fullRent * 0.10;
        const upfrontPayment = fullRent * 0.75; // 75%
        const totalDueNow = upfrontPayment + securityDeposit + commission;
        
        setCalculations({
          baseAmount: fullRent,
          commission,
          total: totalDueNow,
          securityDeposit,
        });
      } else {
        // Flexi50 Plan: 50% upfront at 12% commission
        const commission = fullRent * 0.12;
        const upfrontPayment = fullRent * 0.50; // 50%
        const totalDueNow = upfrontPayment + securityDeposit + commission;
        
        setCalculations({
          baseAmount: fullRent,
          commission,
          total: totalDueNow,
          securityDeposit,
        });
      }
    } else if (type === "sale" && property) {
      const salePrice = parseFloat(property.price.replace(/[^0-9.-]+/g, ""));
      const commission = salePrice * 0.05; // 5% commission for sales
      const total = salePrice + commission;

      setCalculations({
        baseAmount: salePrice,
        commission,
        total,
        securityDeposit: 0,
      });
    } else if (type === "service" && service) {
      const hourlyRate = parseFloat(service.rate.replace(/[^0-9.-]+/g, ""));
      const baseAmount = hourlyRate * hours;
      const commission = baseAmount * 0.10;
      const total = baseAmount + commission;

      setCalculations({
        baseAmount,
        commission,
        total,
        securityDeposit: 0,
      });
    }
  }, [type, property, service, duration, hours, paymentPlan, paymentId]);

  // Create payment record immediately when checkout page loads for tracking
  useEffect(() => {
    if (!paymentId && !createdPaymentId && user && calculations.total > 0) {
      createInitialPaymentRecord();
    }
  }, [calculations.total, user]);

  const getPaymentPlanLabel = () => {
    if (paymentPlan === "full") return "Full Payment (100%, 8%)";
    if (paymentPlan === "flexi75") return "Flexi75 (75%, 10%)";
    return "Flexi50 (50%, 12%)";
  };

  const createInitialPaymentRecord = async () => {
    if (!user) return;

    try {
      if (type === "rental" && property) {
        const monthlyRent = parseFloat(property.price.replace(/[^0-9.-]+/g, ""));
        const leaseStartDate = new Date().toISOString().split('T')[0];
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + duration);
        const rentExpirationDate = expirationDate.toISOString().split('T')[0];

        const { data: leaseData, error: leaseError } = await supabase
          .from("rental_leases")
          .insert({
            property_id: property.id,
            tenant_id: user.id,
            landlord_id: property.owner_id,
            lease_start_date: leaseStartDate,
            first_payment_date: leaseStartDate,
            rent_expiration_date: rentExpirationDate,
            lease_duration_months: duration,
            monthly_rent: monthlyRent,
            notes: `${getPaymentPlanLabel()} plan - Checkout initiated`,
            status: "pending",
          })
          .select()
          .single();

        if (leaseError) throw leaseError;

        const { data: paymentData, error: paymentError } = await supabase
          .from("rental_payments")
          .insert({
            lease_id: leaseData.id,
            property_id: property.id,
            tenant_id: user.id,
            landlord_id: property.owner_id,
            due_date: leaseStartDate,
            amount: calculations.total,
            status: "pending",
            verification_status: "pending_review",
            is_first_payment: true,
            installment_number: 1,
            payment_type: "rental",
            notes: `${getPaymentPlanLabel()} - Checkout initiated`,
          })
          .select()
          .single();

        if (paymentError) throw paymentError;
        setCreatedPaymentId(paymentData.id);
      } else if (type === "sale" && property) {
        const { data: paymentData, error: salePaymentError } = await supabase
          .from("rental_payments")
          .insert({
            property_id: property.id,
            tenant_id: user.id,
            landlord_id: property.owner_id,
            due_date: new Date().toISOString().split('T')[0],
            amount: calculations.total,
            status: "pending",
            verification_status: "pending_review",
            payment_type: "sale",
            notes: `Property sale - Checkout initiated`,
          })
          .select()
          .single();

        if (salePaymentError) throw salePaymentError;
        setCreatedPaymentId(paymentData.id);
      } else if (type === "service" && service) {
        const { data: paymentData, error: servicePaymentError } = await supabase
          .from("rental_payments")
          .insert({
            tenant_id: user.id,
            landlord_id: service.provider_id || service.id || null,
            due_date: new Date().toISOString().split('T')[0],
            amount: calculations.total,
            status: "pending",
            verification_status: "pending_review",
            payment_type: "service",
            notes: `Service booking (${hours} hours) - Checkout initiated. Service: ${service.title || service.name || 'N/A'}`,
          })
          .select()
          .single();

        if (servicePaymentError) throw servicePaymentError;
        setCreatedPaymentId(paymentData.id);
      }
    } catch (error) {
      console.error("Error creating initial payment record:", error);
    }
  };

  const fetchPaymentDetails = async () => {
    setLoadingPayment(true);
    try {
      const { data, error } = await supabase
        .from("rental_payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      if (error) throw error;
      setPaymentDetails(data);
    } catch (error) {
      console.error("Error fetching payment:", error);
      toast({
        title: "Error",
        description: "Failed to load payment details",
        variant: "destructive",
      });
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleDurationChange = (increment: boolean) => {
    setDuration((prev) => {
      const newValue = increment ? prev + 1 : prev - 1;
      return Math.max(0, Math.min(24, newValue));
    });
  };

  const handleHoursChange = (increment: boolean) => {
    setHours((prev) => {
      const newValue = increment ? prev + 1 : prev - 1;
      return Math.max(0, Math.min(24, newValue));
    });
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete payment",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!transactionReference.trim()) {
      toast({
        title: "Transaction Reference Required",
        description: "Please enter your transaction reference number",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const targetPaymentId = paymentId || createdPaymentId;

      if (targetPaymentId) {
        // Update existing payment record with transaction details
        const { error } = await supabase
          .from("rental_payments")
          .update({
            payment_date: new Date().toISOString(),
            payment_method: paymentMethod,
            transaction_reference: transactionReference,
            status: "pending",
            verification_status: "pending_review",
            notes: `Payment via ${paymentMethod}${paymentMethod === "mobile" ? ` - ${mobileProvider}` : ""}. ${getPaymentPlanLabel()} plan.`,
          })
          .eq("id", targetPaymentId);

        if (error) throw error;

        toast({
          title: "Payment Submitted!",
          description: "Your payment has been submitted for admin verification. You'll be notified once approved.",
        });
        navigate("/profile");
      } else if (type === "rental" && property) {
        // For new rental, create lease and payment records
        const monthlyRent = parseFloat(property.price.replace(/[^0-9.-]+/g, ""));
        const leaseStartDate = new Date().toISOString().split('T')[0];
        const firstPaymentDate = leaseStartDate;
        
        // Calculate rent expiration date
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + duration);
        const rentExpirationDate = expirationDate.toISOString().split('T')[0];

        // Create lease first
        const { data: leaseData, error: leaseError } = await supabase
          .from("rental_leases")
          .insert({
            property_id: property.id,
            tenant_id: user.id,
            landlord_id: property.owner_id,
            lease_start_date: leaseStartDate,
            first_payment_date: firstPaymentDate,
            rent_expiration_date: rentExpirationDate,
            lease_duration_months: duration,
            monthly_rent: monthlyRent,
            notes: `${getPaymentPlanLabel()} plan selected`,
            status: "pending",
          })
          .select()
          .single();

        if (leaseError) throw leaseError;

        // Create initial payment record
        const { error: paymentError } = await supabase
          .from("rental_payments")
          .insert({
            lease_id: leaseData.id,
            property_id: property.id,
            tenant_id: user.id,
            landlord_id: property.owner_id,
            due_date: firstPaymentDate,
            payment_date: new Date().toISOString(),
            amount: calculations.total,
            payment_method: paymentMethod,
            transaction_reference: transactionReference,
            status: "pending",
            verification_status: "pending_review",
            is_first_payment: true,
            installment_number: 1,
            payment_type: "rental",
            notes: `${getPaymentPlanLabel()}. Payment via ${paymentMethod}${paymentMethod === "mobile" ? ` - ${mobileProvider}` : ""}`,
          });

        if (paymentError) throw paymentError;

        toast({
          title: "Payment Submitted!",
          description: "Your rental payment has been submitted for admin verification. You'll be notified once approved.",
        });
        navigate("/profile");
      } else if (type === "sale" && property) {
        // Create payment record for sale
        const { error: salePaymentError } = await supabase
          .from("rental_payments")
          .insert({
            property_id: property.id,
            tenant_id: user.id,
            landlord_id: property.owner_id,
            due_date: new Date().toISOString().split('T')[0],
            payment_date: new Date().toISOString(),
            amount: calculations.total,
            payment_method: paymentMethod,
            transaction_reference: transactionReference,
            status: "pending",
            verification_status: "pending_review",
            payment_type: "sale",
            notes: `Property sale. Payment via ${paymentMethod}${paymentMethod === "mobile" ? ` - ${mobileProvider}` : ""}`,
          });

        if (salePaymentError) throw salePaymentError;

        toast({
          title: "Payment Submitted!",
          description: "Your sale payment has been submitted for admin verification. You'll be notified once approved.",
        });
        navigate("/profile");
      } else if (type === "service" && service) {
        // Create payment record for service booking
        const { error: servicePaymentError } = await supabase
          .from("rental_payments")
          .insert({
            tenant_id: user.id,
            landlord_id: service.provider_id || service.id || null,
            due_date: new Date().toISOString().split('T')[0],
            payment_date: new Date().toISOString(),
            amount: calculations.total,
            payment_method: paymentMethod,
            transaction_reference: transactionReference,
            status: "pending",
            verification_status: "pending_review",
            payment_type: "service",
            notes: `Service booking payment (${hours} hours). Payment via ${paymentMethod}${paymentMethod === "mobile" ? ` - ${mobileProvider}` : ""}. Service: ${service.title || service.name || 'N/A'}`,
          });

        if (servicePaymentError) throw servicePaymentError;

        toast({
          title: "Payment Submitted!",
          description: "Your service payment has been submitted for admin verification. You'll be notified once approved.",
        });
        navigate("/profile");
      } else {
        // Fallback for any other payment types
        toast({
          title: "Payment Submitted!",
          description: "Your payment has been submitted. We'll contact you shortly.",
        });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Failed",
        description: "Failed to process your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!type && !paymentId) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <h1 className="text-3xl font-bold">Please select a property or service first</h1>
        </div>
        <Footer />
      </div>
    );
  }

  if (loadingPayment) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <h1 className="text-3xl font-bold">Loading payment details...</h1>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Checkout</h1>
            <p className="text-muted-foreground text-lg">
              {paymentId
                ? "Complete your rental payment"
                : type === "rental" 
                ? "Complete your payment and secure your rent"
                : type === "sale"
                ? "Complete your payment and secure your sale"
                : "Complete your booking and secure your service"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {paymentId 
                    ? "Payment Summary"
                    : type === "rental" ? "Rent Summary" : type === "sale" ? "Sale Summary" : "Service Summary"}
                </CardTitle>
                <CardDescription>Review your selection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentId && paymentDetails ? (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {paymentDetails.is_first_payment 
                          ? "First Payment (6-12 months)" 
                          : `Installment #${paymentDetails.installment_number}`}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Due: {format(new Date(paymentDetails.due_date), "MMM dd, yyyy")}
                      </p>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Amount Due:</span>
                        <span className="font-semibold">{formatPrice(paymentDetails.amount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span>{formatPrice(paymentDetails.amount)}</span>
                      </div>
                    </div>
                  </>
                ) : type === "rental" && property && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg">{property.title}</h3>
                      <p className="text-muted-foreground text-sm">{property.location}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Rental Duration (Months)</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleDurationChange(false)}
                          disabled={duration <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-2xl font-bold">{duration}</span>
                          <span className="text-muted-foreground ml-1">months</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleDurationChange(true)}
                          disabled={duration >= 24}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Payment Plan</Label>
                      <RadioGroup value={paymentPlan} onValueChange={(value: "full" | "flexi75" | "flexi50") => setPaymentPlan(value)}>
                        <div className={`flex items-center space-x-2 border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentPlan === "full" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"}`}>
                          <RadioGroupItem value="full" id="full" />
                          <Label htmlFor="full" className="cursor-pointer flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Full Payment</span>
                              <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Best Value</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">Pay 100% upfront at 8% commission - Save 4%</div>
                          </Label>
                        </div>
                        <div className={`flex items-center space-x-2 border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentPlan === "flexi75" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"}`}>
                          <RadioGroupItem value="flexi75" id="flexi75" />
                          <Label htmlFor="flexi75" className="cursor-pointer flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Flexi75 Plan</span>
                              <span className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">Balanced</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">Pay 75% upfront at 10% commission - Save 2%</div>
                          </Label>
                        </div>
                        <div className={`flex items-center space-x-2 border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentPlan === "flexi50" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"}`}>
                          <RadioGroupItem value="flexi50" id="flexi50" />
                          <Label htmlFor="flexi50" className="cursor-pointer flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Flexi50 Plan</span>
                              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">Most Flexible</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">Pay 50% upfront at 12% commission</div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Rent</span>
                        <span className="font-semibold">
                          {duration > 0 ? formatPrice(calculations.baseAmount / duration) : formatPrice(0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Full Rent ({duration} months)</span>
                        <span className="font-semibold">
                          {formatPrice(calculations.baseAmount)}
                        </span>
                      </div>
                      
                      {paymentPlan === "full" && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Upfront Payment (100%)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.baseAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Security Deposit (1 month, refundable)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.securityDeposit)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commission (8%)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.commission)}
                            </span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Total Due Now</span>
                            <span className="text-green-600 dark:text-green-400">
                              {formatPrice(calculations.total)}
                            </span>
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 text-right">
                            You save {formatPrice(calculations.baseAmount * 0.04)} compared to Flexi50!
                          </div>
                        </>
                      )}
                      
                      {paymentPlan === "flexi75" && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Upfront Payment (75%)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.baseAmount * 0.75)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Security Deposit (1 month, refundable)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.securityDeposit)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commission (10%)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.commission)}
                            </span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Total Due Now</span>
                            <span className="text-blue-600 dark:text-blue-400">
                              {formatPrice(calculations.total)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            Remaining balance: {formatPrice(calculations.baseAmount * 0.25)} (payable later)
                          </div>
                        </>
                      )}
                      
                      {paymentPlan === "flexi50" && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Upfront Payment (50%)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.baseAmount * 0.50)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Security Deposit (1 month, refundable)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.securityDeposit)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commission (12%)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.commission)}
                            </span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Total Due Now</span>
                            <span className="text-accent">
                              {formatPrice(calculations.total)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            Remaining balance: {formatPrice(calculations.baseAmount * 0.50)} (payable later)
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {type === "sale" && property && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg">{property.title}</h3>
                      <p className="text-muted-foreground text-sm">{property.location}</p>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sale Price</span>
                        <span className="font-semibold">
                          {formatPrice(calculations.baseAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission (5%)</span>
                        <span className="font-semibold">
                          {formatPrice(calculations.commission)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total Due</span>
                        <span className="text-primary">
                          {formatPrice(calculations.total)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {type === "service" && service && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg">{service.title}</h3>
                      <p className="text-muted-foreground text-sm">{service.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Service Duration (Hours)</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleHoursChange(false)}
                          disabled={hours <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-2xl font-bold">{hours}</span>
                          <span className="text-muted-foreground ml-1">hours</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleHoursChange(true)}
                          disabled={hours >= 24}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Service Cost ({hours} hours)
                        </span>
                        <span className="font-semibold">
                          {formatPrice(calculations.baseAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission (10%)</span>
                        <span className="font-semibold">
                          {formatPrice(calculations.commission)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total Amount</span>
                        <span className="text-accent">
                          {formatPrice(calculations.total)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className="bg-secondary/30 p-3 rounded-lg flex items-start gap-2 text-sm">
                  <Calculator className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    {type === "rental" 
                      ? paymentPlan === "full"
                        ? "Full payment: Pay all months upfront + refundable security deposit + 10% commission. Save 2% on commission fees."
                        : "Flexible payment: Pay 50% advance + refundable security deposit + 12% commission upfront. Remaining balance paid over time."
                      : "All prices include a 10% commission for FlexiRents platform services and support."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Choose your payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-6">
                  {/* Payment Method Selection */}
                  <div className="space-y-3">
                    <Label>Payment Method</Label>
                    <RadioGroup value={paymentMethod} onValueChange={(value: "card" | "mobile") => setPaymentMethod(value)}>
                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5 text-accent" />
                          <div>
                            <div className="font-semibold">Card Payment</div>
                            <div className="text-xs text-muted-foreground">Pay with credit or debit card</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                        <RadioGroupItem value="mobile" id="mobile" />
                        <Label htmlFor="mobile" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Smartphone className="h-5 w-5 text-accent" />
                          <div>
                            <div className="font-semibold">Mobile Money</div>
                            <div className="text-xs text-muted-foreground">Pay with Vodafone or MTN</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Card Payment Form */}
                  {paymentMethod === "card" && (
                    <div className="space-y-4 animate-in fade-in-50 duration-300">
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Cardholder Name</Label>
                        <Input id="cardName" placeholder="John Doe" required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" placeholder="123" required />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billingAddress">Billing Address</Label>
                        <Input
                          id="billingAddress"
                          placeholder="123 Main St, City, State, ZIP"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Mobile Money Form */}
                  {paymentMethod === "mobile" && (
                    <div className="space-y-4 animate-in fade-in-50 duration-300">
                      <div className="space-y-2">
                        <Label htmlFor="provider">Mobile Money Provider</Label>
                        <Select value={mobileProvider} onValueChange={setMobileProvider} required>
                          <SelectTrigger id="provider">
                            <SelectValue placeholder="Select your provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                            <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Mobile Money Number</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          placeholder="024 123 4567"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name</Label>
                        <Input
                          id="accountName"
                          placeholder="John Doe"
                          required
                        />
                      </div>

                      <div className="bg-secondary/30 p-3 rounded-lg text-sm text-muted-foreground">
                        <p>You will receive a prompt on your phone to approve the payment.</p>
                      </div>
                    </div>
                  )}

                  {/* Transaction Reference */}
                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="transactionRef">Transaction Reference *</Label>
                    <Input
                      id="transactionRef"
                      placeholder="Enter transaction reference or payment confirmation code"
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your payment confirmation reference number
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    size="lg" 
                    className="w-full mt-6"
                    disabled={submitting}
                  >
                    {submitting ? "Processing..." : `Complete Payment - ${formatPrice(calculations.total)}`}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By completing this payment, you agree to our terms of service and privacy policy.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
