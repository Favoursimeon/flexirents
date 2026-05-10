import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Download, FileText, FileSpreadsheet, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '@/lib/api';

interface PaymentRecord {
  id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: string;
  payment_method: string | null;
  transaction_reference: string | null;
  installment_number: number | null;
  notes: string | null;
  rental_leases?: {
    id: string;
    properties?: {
      title: string;
      location: string;
    };
  };
}

export const PaymentHistoryExport = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  useEffect(() => {
    if (user) fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    try {
      const { data } = await api.get('/api/payments/history');
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const exportCSV = () => {
    const headers = ['Date', 'Property', 'Amount', 'Status', 'Method', 'Reference'];
    const rows = filteredPayments.map((p) => [
      p.payment_date ? format(new Date(p.payment_date), 'MMM d, yyyy') : 'Pending',
      p.rental_leases?.properties?.title || 'N/A',
      `GHS ${p.amount.toLocaleString()}`,
      p.status,
      p.payment_method || 'N/A',
      p.transaction_reference || 'N/A',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      doc.text('Payment History', 14, 16);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 22);
      autoTable(doc, {
        startY: 28,
        head: [['Date', 'Property', 'Amount (GHS)', 'Status', 'Method']],
        body: filteredPayments.map((p) => [
          p.payment_date ? format(new Date(p.payment_date), 'MMM d, yyyy') : 'Pending',
          p.rental_leases?.properties?.title || 'N/A',
          p.amount.toLocaleString(),
          p.status,
          p.payment_method || 'N/A',
        ]),
      });
      doc.save(`payment-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF exported');
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="default">Paid</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Payment History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={exportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={exportPDF} disabled={exporting}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading payment history...</p>
        ) : filteredPayments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No payment records found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {payment.payment_date
                      ? format(new Date(payment.payment_date), 'MMM d, yyyy')
                      : <span className="text-muted-foreground">Pending</span>}
                  </TableCell>
                  <TableCell>{payment.rental_leases?.properties?.title || 'N/A'}</TableCell>
                  <TableCell>₵{payment.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                  <TableCell className="font-mono text-xs">{payment.transaction_reference || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};