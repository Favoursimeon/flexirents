import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format, addMonths } from 'date-fns';
import { Plus, Calendar, Pause, Play, Trash2, RefreshCw, Clock, Banknote, AlertTriangle, Loader2, Zap } from 'lucide-react';

interface PaymentAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  is_primary: boolean;
  is_verified: boolean;
  paystack_authorization_code: string | null;
}

interface RentalLease {
  id: string;
  monthly_rent: number;
  lease_start_date: string;
  rent_expiration_date: string;
  properties?: {
    title: string;
    location: string;
  };
}

interface RecurringSchedule {
  id: string;
  amount: number;
  frequency: string;
  day_of_month: number;
  start_date: string;
  end_date: string | null;
  next_payment_date: string;
  status: string;
  last_payment_date: string | null;
  last_payment_status: string | null;
  total_payments_made: number;
  notes: string | null;
  lease_id: string | null;
  payment_account_id: string | null;
  payment_accounts?: PaymentAccount;
  rental_leases?: RentalLease;
}

// Mock process automatic payment (will use Paystack charge_authorization when API is added)
const mockProcessAutomaticPayment = async (
  _recipientCode: string,
  amount: number,
  _scheduleId: string
): Promise<{ success: boolean; reference: string; message: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // In production: This would call Paystack's transfer endpoint
  // POST /transfer with recipient_code and amount
  return {
    success: true,
    reference: `PAY_${Date.now()}`,
    message: `Payment of GH₵ ${amount.toLocaleString()} processed successfully`,
  };
};

export const RecurringPaymentScheduler = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [leases, setLeases] = useState<RentalLease[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    lease_id: '',
    payment_account_id: '',
    amount: '',
    frequency: 'monthly',
    day_of_month: '1',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [schedulesRes, accountsRes, leasesRes] = await Promise.all([
        api.get<RecurringSchedule[]>('/api/recurring-payment-schedules', {
          params: {
            user_id: user?.id,
            order: 'created_at.desc',
            include: 'payment_accounts,rental_leases',
          },
        }),
        api.get<PaymentAccount[]>('/api/payment-accounts', {
          params: {
            user_id: user?.id,
            is_verified: true,
          },
        }),
        api.get<RentalLease[]>('/api/rental-leases', {
          params: {
            tenant_id: user?.id,
            status: 'active',
          },
        }),
      ]);

      setSchedules(schedulesRes.data || []);
      setAccounts(accountsRes.data || []);
      setLeases(leasesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!formData.payment_account_id || !formData.amount) {
      toast.error('Please select a payment account and enter an amount');
      return;
    }

    try {
      const startDate = new Date();
      const dayOfMonth = parseInt(formData.day_of_month);
      
      // Calculate next payment date
      let nextPaymentDate = new Date(startDate.getFullYear(), startDate.getMonth(), dayOfMonth);
      if (nextPaymentDate <= startDate) {
        nextPaymentDate = addMonths(nextPaymentDate, 1);
      }

      await api.post('/api/recurring-payment-schedules', {
        user_id: user?.id,
        lease_id: formData.lease_id || null,
        payment_account_id: formData.payment_account_id,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        day_of_month: dayOfMonth,
        start_date: startDate.toISOString().split('T')[0],
        next_payment_date: nextPaymentDate.toISOString().split('T')[0],
        notes: formData.notes || null,
      });

      toast.success('Recurring payment schedule created');
      setDialogOpen(false);
      setFormData({
        lease_id: '',
        payment_account_id: '',
        amount: '',
        frequency: 'monthly',
        day_of_month: '1',
        notes: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule');
    }
  };

  const handleToggleStatus = async (scheduleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      await api.put(`/api/recurring-payment-schedules/${scheduleId}`, {
        status: newStatus,
      });

      toast.success(`Schedule ${newStatus === 'active' ? 'activated' : 'paused'}`);
      fetchData();
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await api.delete(`/api/recurring-payment-schedules/${scheduleId}`);

      toast.success('Schedule deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const handleProcessPaymentNow = async (schedule: RecurringSchedule) => {
    if (!schedule.payment_accounts) {
      toast.error('No payment account linked to this schedule');
      return;
    }

    try {
      setProcessingPayment(schedule.id);
      
      // Process payment via Paystack (mock for now)
      const result = await mockProcessAutomaticPayment(
        schedule.payment_accounts.account_number, // Will use recipient_code when API is added
        schedule.amount,
        schedule.id
      );

      if (result.success) {
        // Update schedule with payment info
        const nextPaymentDate = addMonths(new Date(schedule.next_payment_date), 
          schedule.frequency === 'monthly' ? 1 : schedule.frequency === 'quarterly' ? 3 : 0.5
        );

        await api.put(`/api/recurring-payment-schedules/${schedule.id}`, {
          last_payment_date: new Date().toISOString().split('T')[0],
          last_payment_status: 'success',
          next_payment_date: nextPaymentDate.toISOString().split('T')[0],
          total_payments_made: (schedule.total_payments_made || 0) + 1,
        });

        toast.success(result.message);
        fetchData();
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment processing failed');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleLeaseSelect = (leaseId: string) => {
    const selectedLease = leases.find(l => l.id === leaseId);
    setFormData({
      ...formData,
      lease_id: leaseId,
      amount: selectedLease ? selectedLease.monthly_rent.toString() : formData.amount,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Automatic Payment Schedules
            </CardTitle>
            <CardDescription>
              Set up standing orders for automatic rent payments from your bank account
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={accounts.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Recurring Payment</DialogTitle>
                <DialogDescription>
                  Set up an automatic payment schedule for your rent
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {leases.length > 0 && (
                  <div className="space-y-2">
                    <Label>Link to Lease (Optional)</Label>
                    <Select
                      value={formData.lease_id}
                      onValueChange={handleLeaseSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lease" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No lease linked</SelectItem>
                        {leases.map((lease) => (
                          <SelectItem key={lease.id} value={lease.id}>
                            GH₵ {lease.monthly_rent.toLocaleString()} / month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Payment Account *</Label>
                  <Select
                    value={formData.payment_account_id}
                    onValueChange={(value) => setFormData({ ...formData, payment_account_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bank_name} - {account.account_name}
                          {account.is_primary && ' (Primary)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (GH₵) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter amount"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="day_of_month">Day of Month</Label>
                    <Select
                      value={formData.day_of_month}
                      onValueChange={(value) => setFormData({ ...formData, day_of_month: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any notes..."
                    rows={2}
                  />
                </div>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Please ensure you have set up a standing order with your bank for automatic deductions. 
                    This schedule helps track your payments.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSchedule}>Create Schedule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No verified payment accounts found</p>
            <p className="text-sm">Add and verify a payment account first to create recurring schedules</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recurring payments scheduled</p>
            <p className="text-sm">Create a schedule to automate your rent payments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-primary" />
                      <span className="font-bold text-lg">
                        GH₵ {schedule.amount.toLocaleString()}
                      </span>
                      {getStatusBadge(schedule.status)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} on the {schedule.day_of_month}
                        {schedule.day_of_month === 1 ? 'st' : schedule.day_of_month === 2 ? 'nd' : schedule.day_of_month === 3 ? 'rd' : 'th'}
                      </p>
                      {schedule.payment_accounts && (
                        <p>
                          From: {schedule.payment_accounts.bank_name} - ••••{schedule.payment_accounts.account_number.slice(-4)}
                        </p>
                      )}
                      <p>
                        Next payment: {format(new Date(schedule.next_payment_date), 'MMM d, yyyy')}
                      </p>
                      <p>
                        Total payments made: {schedule.total_payments_made}
                      </p>
                    </div>
                    
                    {schedule.notes && (
                      <p className="text-sm italic text-muted-foreground mt-2">
                        "{schedule.notes}"
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {schedule.status === 'active' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleProcessPaymentNow(schedule)}
                        disabled={processingPayment === schedule.id}
                      >
                        {processingPayment === schedule.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-1" />
                            Pay Now
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleStatus(schedule.id, schedule.status)}
                    >
                      {schedule.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
