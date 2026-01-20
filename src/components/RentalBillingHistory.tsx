import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RentalPayment {
  id: string;
  amount: number;
  payment_date: string | null;
  due_date: string;
  status: string;
  verification_status: string;
  payment_method: string | null;
  transaction_reference: string | null;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
  payment_link: string | null;
  installment_number: number;
  is_first_payment: boolean;
}

export default function RentalBillingHistory() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<RentalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingPayments, setUpcomingPayments] = useState<RentalPayment[]>([]);
  const [nextDueDate, setNextDueDate] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPayments();
      fetchNextDueDate();
    }
  }, [user]);

  const fetchNextDueDate = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("rental_payments")
        .select("due_date")
        .eq("tenant_id", user.id)
        .eq("status", "pending")
        .order("due_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setNextDueDate(data.due_date);
      }
    } catch (error) {
      console.error("Error fetching next due date:", error);
    }
  };

  const fetchPayments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("rental_payments")
        .select("*")
        .eq("tenant_id", user.id)
        .order("installment_number", { ascending: false });

      if (error) throw error;

      const allPayments = data || [];
      setPayments(allPayments);

      // Filter only the next pending payment
      const pending = allPayments
        .filter((payment) => payment.status === "pending")
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      
      setUpcomingPayments(pending.length > 0 ? [pending[0]] : []);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (paymentId: string) => {
    navigate('/checkout', { state: { paymentId } });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: "Paid", variant: "default" as const, icon: CheckCircle2, color: "text-green-600" },
      pending: { label: "Pending", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      overdue: { label: "Overdue", variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
      cancelled: { label: "Cancelled", variant: "outline" as const, icon: XCircle, color: "text-gray-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const getVerificationBadge = (status: string) => {
    const statusConfig = {
      verified: { label: "Verified", variant: "default" as const, color: "bg-green-500" },
      unverified: { label: "Unverified", variant: "secondary" as const, color: "bg-gray-500" },
      pending: { label: "Pending", variant: "outline" as const, color: "bg-yellow-500" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unverified;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <div className={`h-2 w-2 rounded-full ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const handleDownloadReceipt = async (payment: RentalPayment) => {
    if (!payment.receipt_url && payment.status !== 'paid') {
      toast.error("No receipt available for this payment");
      return;
    }

    try {
      // If receipt URL exists, open it
      if (payment.receipt_url) {
        window.open(payment.receipt_url, "_blank");
        toast.success("Receipt downloaded");
        return;
      }

      // Otherwise, generate a PDF receipt
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235); // Blue
      doc.text("Payment Receipt", 105, 20, { align: 'center' });
      
      // Add company/property info
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("FlexiLiving - Rental Payment System", 105, 30, { align: 'center' });
      
      // Add divider
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 35, 190, 35);
      
      // Payment details
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      let yPos = 50;
      doc.text("Payment Details:", 20, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`Receipt ID: ${payment.id.substring(0, 8).toUpperCase()}`, 20, yPos);
      
      yPos += 8;
      doc.text(`Installment: ${payment.is_first_payment ? 'First Payment (6-12 months)' : `#${payment.installment_number}`}`, 20, yPos);
      
      yPos += 8;
      doc.text(`Amount Paid: ${formatPrice(payment.amount)}`, 20, yPos);
      
      yPos += 8;
      doc.text(`Payment Date: ${payment.payment_date ? format(new Date(payment.payment_date), "MMMM dd, yyyy") : 'N/A'}`, 20, yPos);
      
      yPos += 8;
      doc.text(`Due Date: ${format(new Date(payment.due_date), "MMMM dd, yyyy")}`, 20, yPos);
      
      yPos += 8;
      doc.text(`Payment Method: ${payment.payment_method || 'Not specified'}`, 20, yPos);
      
      yPos += 8;
      doc.text(`Transaction Reference: ${payment.transaction_reference || 'N/A'}`, 20, yPos);
      
      yPos += 8;
      doc.text(`Status: ${payment.status.toUpperCase()}`, 20, yPos);
      
      yPos += 8;
      doc.text(`Verification Status: ${payment.verification_status.toUpperCase()}`, 20, yPos);
      
      // Add footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("This is an automatically generated receipt.", 105, 280, { align: 'center' });
      doc.text(`Generated on ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}`, 105, 285, { align: 'center' });
      
      // Save the PDF
      doc.save(`receipt-${payment.is_first_payment ? 'first-payment' : `installment-${payment.installment_number}`}.pdf`);
      toast.success("Receipt downloaded successfully");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    }
  };

  if (loading) {
    return (
      <Card className="max-w-5xl">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading payment history...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate lease details
  const leaseDurationMonths = payments.length <= 7 ? 12 : 24;
  const firstPaymentMonths = leaseDurationMonths === 12 ? 6 : 12;
  
  const monthsPaidVerified = payments
    .filter((p) => p.status === "paid" && p.verification_status === "verified")
    .reduce((total, p) => {
      return total + (p.is_first_payment ? firstPaymentMonths : 1);
    }, 0);

  // Filter payments to display - show all non-pending + only next pending
  const pendingPayments = payments
    .filter(p => p.status === 'pending')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  const nextPendingPayment = pendingPayments[0];
  const displayedPayments = payments.filter(p => 
    p.status !== 'pending' || (nextPendingPayment && p.id === nextPendingPayment.id)
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(
                  payments
                    .filter((p) => p.status === "paid")
                    .reduce((sum, p) => sum + p.amount, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatPrice(
                  payments
                    .filter((p) => p.status === "pending")
                    .reduce((sum, p) => sum + p.amount, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {formatPrice(
                  payments
                    .filter((p) => p.status === "overdue")
                    .reduce((sum, p) => sum + p.amount, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Verified</p>
              <p className="text-2xl font-bold">
                {monthsPaidVerified}
                <span className="text-sm text-muted-foreground">
                  /{leaseDurationMonths}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Due Date Alert Banner */}
      {nextDueDate && (
        <Alert className="bg-yellow-500/10 border-yellow-500/50">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-sm">
            You have a payment due on <strong>{format(new Date(nextDueDate), "MMMM dd, yyyy")}</strong>. 
            Please ensure timely payment to avoid any issues with your lease.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment History Table with Integrated Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View all your rental payment transactions and download receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayedPayments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No payment history available.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Installment</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedPayments.map((payment, index) => {
                    const isNextPending = nextPendingPayment && payment.id === nextPendingPayment.id;
                    const canPay = isNextPending && payment.payment_link;
                    const isLocked = payment.status === 'pending' && !isNextPending;
                    
                    return (
                      <TableRow 
                        key={payment.id}
                        className={isNextPending ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-500' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {payment.is_first_payment 
                                ? "First (6-12mo)" 
                                : payment.status === 'pending' && isNextPending
                                  ? "Next Due"
                                  : `#${payment.installment_number}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {format(new Date(payment.due_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(payment.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{getVerificationBadge(payment.verification_status)}</TableCell>
                        <TableCell>
                          {payment.payment_date
                            ? format(new Date(payment.payment_date), "MMM dd, yyyy")
                            : <span className="text-muted-foreground">Pending</span>}
                        </TableCell>
                        <TableCell>
                          {payment.status === 'paid' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadReceipt(payment)}
                              className="h-8"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Receipt
                            </Button>
                          ) : payment.status === 'pending' ? (
                            <Button
                              size="sm"
                              disabled={!isNextPending}
                              onClick={() => handlePayment(payment.id)}
                              className={isNextPending ? "bg-blue-600 hover:bg-blue-700 h-8" : "h-8"}
                            >
                              {isLocked ? (
                                <>🔒 Locked</>
                              ) : (
                                "Pay Now"
                              )}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
