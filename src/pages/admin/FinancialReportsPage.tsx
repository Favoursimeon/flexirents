import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Calendar, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const COMMISSION_RATE = 0.10;

interface PaymentData {
  id: string;
  amount: number;
  payment_type: string | null;
  payment_date: string | null;
  due_date: string;
  status: string;
  verification_status: string;
  created_at: string;
}

interface ReportData {
  totalRevenue: number;
  totalProfit: number;
  verifiedPayments: number;
  pendingPayments: number;
  paymentsByType: Record<string, { count: number; amount: number; profit: number }>;
  monthlyBreakdown: { month: string; revenue: number; profit: number; count: number }[];
  payments: PaymentData[];
}

export default function FinancialReportsPage() {
  const [reportPeriod, setReportPeriod] = useState("last3months");
  const [generating, setGenerating] = useState(false);

  const getDateRange = () => {
    const now = new Date();
    switch (reportPeriod) {
      case "thisMonth":
        return { start: startOfMonth(now), end: endOfMonth(now), label: format(now, "MMMM yyyy") };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth), label: format(lastMonth, "MMMM yyyy") };
      case "last3months":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now), label: "Last 3 Months" };
      case "last6months":
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now), label: "Last 6 Months" };
      case "thisYear":
        return { start: startOfYear(now), end: endOfYear(now), label: format(now, "yyyy") };
      case "lastYear":
        const lastYear = subMonths(now, 12);
        return { start: startOfYear(lastYear), end: endOfYear(lastYear), label: format(lastYear, "yyyy") };
      default:
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now), label: "Last 3 Months" };
    }
  };

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["financial-report", reportPeriod],
    queryFn: async (): Promise<ReportData> => {
      const { start, end } = getDateRange();
      
      const { data: payments, error } = await supabase
        .from("rental_payments")
        .select("id, amount, payment_type, payment_date, due_date, status, verification_status, created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const verifiedPayments = payments?.filter(p => p.verification_status === "verified") || [];
      const pendingPayments = payments?.filter(p => p.verification_status !== "verified") || [];

      const totalRevenue = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalProfit = totalRevenue * COMMISSION_RATE;

      // Group by payment type
      const paymentsByType: Record<string, { count: number; amount: number; profit: number }> = {};
      verifiedPayments.forEach(p => {
        const type = p.payment_type || "rental";
        if (!paymentsByType[type]) {
          paymentsByType[type] = { count: 0, amount: 0, profit: 0 };
        }
        paymentsByType[type].count++;
        paymentsByType[type].amount += p.amount || 0;
        paymentsByType[type].profit += (p.amount || 0) * COMMISSION_RATE;
      });

      // Monthly breakdown
      const monthlyMap: Record<string, { revenue: number; profit: number; count: number }> = {};
      verifiedPayments.forEach(p => {
        const month = format(new Date(p.created_at), "MMM yyyy");
        if (!monthlyMap[month]) {
          monthlyMap[month] = { revenue: 0, profit: 0, count: 0 };
        }
        monthlyMap[month].revenue += p.amount || 0;
        monthlyMap[month].profit += (p.amount || 0) * COMMISSION_RATE;
        monthlyMap[month].count++;
      });

      const monthlyBreakdown = Object.entries(monthlyMap)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      return {
        totalRevenue,
        totalProfit,
        verifiedPayments: verifiedPayments.length,
        pendingPayments: pendingPayments.length,
        paymentsByType,
        monthlyBreakdown,
        payments: payments || [],
      };
    },
  });

  const generatePDF = async () => {
    if (!reportData) return;
    
    setGenerating(true);
    try {
      const { label } = getDateRange();
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Financial Report", 14, 22);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Period: ${label}`, 14, 32);
      doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, 14, 40);

      // Summary section
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Summary", 14, 55);

      const summaryData = [
        ["Total Revenue", `$${reportData.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ["Total Profit (10% Commission)", `$${reportData.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ["Verified Payments", reportData.verifiedPayments.toString()],
        ["Pending Payments", reportData.pendingPayments.toString()],
      ];

      autoTable(doc, {
        startY: 60,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });

      // Payment Type Breakdown
      let currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("Revenue by Payment Type", 14, currentY);

      const typeData = Object.entries(reportData.paymentsByType).map(([type, data]) => [
        type.charAt(0).toUpperCase() + type.slice(1),
        data.count.toString(),
        `$${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `$${data.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Type", "Count", "Revenue", "Profit"]],
        body: typeData.length > 0 ? typeData : [["No data", "-", "-", "-"]],
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });

      // Monthly Breakdown
      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text("Monthly Breakdown", 14, currentY);

      const monthlyData = reportData.monthlyBreakdown.map(m => [
        m.month,
        m.count.toString(),
        `$${m.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `$${m.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Month", "Transactions", "Revenue", "Profit"]],
        body: monthlyData.length > 0 ? monthlyData : [["No data", "-", "-", "-"]],
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });

      // Recent Transactions (first page only)
      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text("Recent Transactions", 14, currentY);

      const recentPayments = reportData.payments.slice(0, 20).map(p => [
        format(new Date(p.created_at), "MMM d, yyyy"),
        (p.payment_type || "rental").charAt(0).toUpperCase() + (p.payment_type || "rental").slice(1),
        `$${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        p.verification_status === "verified" ? "Verified" : "Pending",
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Date", "Type", "Amount", "Status"]],
        body: recentPayments.length > 0 ? recentPayments : [["No transactions", "-", "-", "-"]],
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} | Flexirent Financial Report`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      doc.save(`financial-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const { label } = getDateRange();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Financial Reports</h2>
          <p className="text-muted-foreground mt-2">Generate and export revenue and profit reports</p>
        </div>
        <Button onClick={generatePDF} disabled={generating || isLoading || !reportData}>
          {generating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {generating ? "Generating..." : "Download PDF Report"}
        </Button>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-2">
              <Label>Select Period</Label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="last3months">Last 3 Months</SelectItem>
                  <SelectItem value="last6months">Last 6 Months</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="lastYear">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary" className="text-sm">
              Showing: {label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                ${reportData?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  ${reportData?.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">{COMMISSION_RATE * 100}% commission</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verified Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{reportData?.verifiedPayments || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-amber-600">{reportData?.pendingPayments || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Payment Type</CardTitle>
          <CardDescription>Breakdown of revenue and profit by category</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(reportData?.paymentsByType || {}).length > 0 ? (
                  Object.entries(reportData?.paymentsByType || {}).map(([type, data]) => (
                    <TableRow key={type}>
                      <TableCell className="font-medium capitalize">{type}</TableCell>
                      <TableCell className="text-right">{data.count}</TableCell>
                      <TableCell className="text-right">
                        ${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ${data.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No payment data for this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>Revenue and profit trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reportData?.monthlyBreakdown || []).length > 0 ? (
                  reportData?.monthlyBreakdown.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right">{month.count}</TableCell>
                      <TableCell className="text-right">
                        ${month.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ${month.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No data for this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest payment activity</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reportData?.payments || []).slice(0, 10).length > 0 ? (
                  reportData?.payments.slice(0, 10).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="capitalize">{payment.payment_type || "rental"}</TableCell>
                      <TableCell className="text-right">
                        ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.verification_status === "verified" ? "default" : "secondary"}>
                          {payment.verification_status === "verified" ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No transactions for this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
