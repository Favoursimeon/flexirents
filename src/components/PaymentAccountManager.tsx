import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, CreditCard, Trash2, Star, Building2, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';

interface PaymentAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  is_primary: boolean;
  is_verified: boolean;
  paystack_recipient_code: string | null;
  paystack_authorization_code: string | null;
  created_at: string;
}

const PAYSTACK_BANK_CODES: Record<string, string> = {
  'Access Bank Ghana': 'ABG',
  'Absa Bank Ghana': 'ABSA',
  'Agricultural Development Bank': 'ADB',
  'Bank of Africa Ghana': 'BOA',
  'CalBank': 'CAL',
  'Consolidated Bank Ghana': 'CBG',
  'Ecobank Ghana': 'ECO',
  'FBN Bank Ghana': 'FBN',
  'Fidelity Bank Ghana': 'FID',
  'First Atlantic Bank': 'FAB',
  'First National Bank': 'FNB',
  'GCB Bank': 'GCB',
  'GTBank Ghana': 'GTB',
  'National Investment Bank': 'NIB',
  'OmniBSIC Bank': 'OMNI',
  'Prudential Bank': 'PRU',
  'Republic Bank Ghana': 'RBG',
  'Société Générale Ghana': 'SGG',
  'Stanbic Bank Ghana': 'SBG',
  'Standard Chartered Ghana': 'SCB',
  'United Bank for Africa': 'UBA',
  'Universal Merchant Bank': 'UMB',
  'Zenith Bank Ghana': 'ZBG',
};

export const PaymentAccountManager = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    account_name: '',
    bank_name: '',
    account_number: '',
    account_type: 'bank',
  });

  useEffect(() => {
    if (user) fetchAccounts();
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get('/api/payment-accounts');
      setAccounts(data || []);
    } catch (error) {
      toast.error('Failed to load payment accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.account_name || !form.bank_name || !form.account_number) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/payment-accounts', form);
      toast.success('Payment account added');
      setDialogOpen(false);
      setForm({ account_name: '', bank_name: '', account_number: '', account_type: 'bank' });
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to add payment account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/payment-accounts/${id}`);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      toast.success('Account removed');
    } catch (error) {
      toast.error('Failed to remove account');
    }
  };

  if (loading) return <div className="p-4 text-muted-foreground">Loading accounts...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment Accounts</CardTitle>
          <CardDescription>Manage your bank accounts for receiving payments</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Account Name</Label>
                <Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="John Doe" />
              </div>
              <div>
                <Label>Bank</Label>
                <Select value={form.bank_name} onValueChange={(val) => setForm({ ...form, bank_name: val })}>
                  <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(PAYSTACK_BANK_CODES).map((bank) => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Account Number</Label>
                <Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} placeholder="0123456789" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Add Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payment accounts added yet.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{account.account_name}</p>
                    <p className="text-xs text-muted-foreground">{account.bank_name} • {account.account_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.is_verified ? (
                    <Badge variant="default" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" />Unverified</Badge>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(account.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};