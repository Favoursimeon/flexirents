import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  lease_id: string | null;
  property_id: string | null;
  booking_id: string | null;
  tenant_id: string;
  landlord_id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: string;
  verification_status: string;
  transaction_reference: string | null;
  payment_method: string | null;
  receipt_url: string | null;
  notes: string | null;
  installment_number: number | null;
  is_first_payment: boolean | null;
  payment_type: string;
}

const getCommissionRate = (notes: string | null): number => {
  if (!notes) return 0.10;
  const lower = notes.toLowerCase();
  if (lower.includes('flexmonthly') || lower.includes('flex monthly')) return 0.15;
  if (lower.includes('flexi50') || lower.includes('flex 50')) return 0.12;
  if (lower.includes('flexi75') || lower.includes('flex 75')) return 0.10;
  if (lower.includes('full payment')) return 0.08;
  if (lower.includes('sale')) return 0.05;
  return 0.10;
};

const getCommissionLabel = (notes: string | null): string => {
  const rate = getCommissionRate(notes);
  return `${(rate * 100).toFixed(0)}%`;
};

export default function PaymentApprovalManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [editForm, setEditForm] = useState({
    amount: "",
    payment_date: "",
    payment_method: "",
    transaction_reference: "",
    notes: "",
  });

  useEffect(() => {
    fetchPayments(activeTab);
  }, [activeTab, dateFrom, dateTo]);

  const fetchPayments = async (tab: "pending" | "approved") => {
    try {
      setLoading(true);
      const statusFilter = tab === "pending" ? "unverified,pending_review" : "verified";
      const params: Record<string, string> = {
        verificationStatus: statusFilter,
        orderBy: "payment_date",
        orderDirection: "desc",
      };
      if (dateFrom) params.dueDateFrom = format(dateFrom, "yyyy-MM-dd");
      if (dateTo) params.dueDateTo = format(dateTo, "yyyy-MM-dd");

      const response = await api.get("/api/admin/payments", { params });
      setPayments(response.data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (payment: Payment) => {
    setSelectedPayment(payment);
    setAdminNotes("");
    setReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      await api.put(`/api/admin/payments/${selectedPayment.id}/approve`, {
        notes: adminNotes || selectedPayment.notes,
      });

      toast.success("Payment approved and verified");
      setReviewDialogOpen(false);
      fetchPayments(activeTab);
    } catch (error) {
      console.error("Error approving payment:", error);
      toast.error("Failed to approve payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      await api.put(`/api/admin/payments/${selectedPayment.id}/reject`, {
        notes: adminNotes || "Payment rejected by admin",
      });

      toast.success("Payment rejected");
      setReviewDialogOpen(false);
      fetchPayments(activeTab);
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("Failed to reject payment");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      completed: "default",
      overdue: "destructive",
      cancelled: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getVerificationBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      unverified: "secondary",
      pending_review: "outline",
      verified: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setEditForm({
      amount: payment.amount.toString(),
      payment_date: payment.payment_date || "",
      payment_method: payment.payment_method || "",
      transaction_reference: payment.transaction_reference || "",
      notes: payment.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      await api.put(`/api/admin/payments/${selectedPayment.id}`, {
        amount: parseFloat(editForm.amount),
        payment_date: editForm.payment_date || null,
        payment_method: editForm.payment_method || null,
        transaction_reference: editForm.transaction_reference || null,
        notes: editForm.notes || null,
      });

      toast.success("Payment updated successfully");
      setEditDialogOpen(false);
      fetchPayments(activeTab);
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment Approval</h1>
        <p className="text-muted-foreground">Review and verify all payments (rentals, sales, and services)</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "approved")}>
        <TabsList>
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
          <TabsTrigger value="approved">Approved Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payment Reviews ({payments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payments pending review
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Transaction Ref</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {payment.payment_type || "rental"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.payment_date
                            ? format(new Date(payment.payment_date), "MMM dd, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.due_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.payment_method || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.transaction_reference || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getCommissionLabel(payment.notes)}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600 dark:text-green-400">
                          ${(payment.amount * getCommissionRate(payment.notes)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{getVerificationBadge(payment.verification_status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(payment)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReview(payment)}
                            >
                              Review
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={7} className="text-right font-bold">Total Profit</TableCell>
                      <TableCell className="font-bold text-green-600 dark:text-green-400">
                        ${payments.reduce((sum, p) => sum + p.amount * getCommissionRate(p.notes), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Approved Payments ({payments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No approved payments yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Transaction Ref</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {payment.payment_type || "rental"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.payment_date
                            ? format(new Date(payment.payment_date), "MMM dd, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.due_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.payment_method || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.transaction_reference || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getCommissionLabel(payment.notes)}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600 dark:text-green-400">
                          ${(payment.amount * getCommissionRate(payment.notes)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{getVerificationBadge(payment.verification_status)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(payment)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={7} className="text-right font-bold">Total Profit</TableCell>
                      <TableCell className="font-bold text-green-600 dark:text-green-400">
                        ${payments.reduce((sum, p) => sum + p.amount * getCommissionRate(p.notes), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Payment</DialogTitle>
            <DialogDescription>
              Review payment details and approve or reject
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Payment Type:</span>
                  <p className="font-semibold capitalize">{selectedPayment.payment_type || "rental"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-semibold">${selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Date:</span>
                  <p>
                    {selectedPayment.payment_date
                      ? format(new Date(selectedPayment.payment_date), "MMM dd, yyyy")
                      : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Due Date:</span>
                  <p>{format(new Date(selectedPayment.due_date), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Method:</span>
                  <p className="capitalize">{selectedPayment.payment_method || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p>{getStatusBadge(selectedPayment.status)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Transaction Reference:</span>
                  <p className="font-mono text-sm">{selectedPayment.transaction_reference || "-"}</p>
                </div>
                {selectedPayment.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Payment Notes:</span>
                    <p className="text-sm">{selectedPayment.notes}</p>
                  </div>
                )}
                {selectedPayment.receipt_url && (
                  <div className="col-span-2">
                    <a
                      href={selectedPayment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Receipt
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add notes about this payment review..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing}
                >
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                >
                  Approve & Verify
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Update payment details
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Amount</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-payment-date">Payment Date</Label>
                  <Input
                    id="edit-payment-date"
                    type="date"
                    value={editForm.payment_date}
                    onChange={(e) => setEditForm({ ...editForm, payment_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-payment-method">Payment Method</Label>
                  <Select
                    value={editForm.payment_method}
                    onValueChange={(value) => setEditForm({ ...editForm, payment_method: value })}
                  >
                    <SelectTrigger id="edit-payment-method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-transaction-ref">Transaction Reference</Label>
                  <Input
                    id="edit-transaction-ref"
                    value={editForm.transaction_reference}
                    onChange={(e) => setEditForm({ ...editForm, transaction_reference: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Add payment notes..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={processing}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
