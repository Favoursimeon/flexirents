import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { PhaseProgressBar } from "@/components/projects/PhaseProgressBar";
import { AutomationTag } from "@/components/projects/AutomationTag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  LayoutDashboard, FolderKanban, Users, CreditCard, AlertTriangle,
  Zap, FileBarChart, Search, Clock, Activity, ChevronRight,
  Command, ArrowUpRight, ArrowDownRight, TrendingUp, X
} from "lucide-react";

type AdminPage = 'overview' | 'all-projects' | 'clients' | 'payments' | 'risks' | 'automation' | 'reports';

const AdminProjectsDashboard = () => {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState<AdminPage>('overview');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const [clock, setClock] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(true); }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto toast simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      toast({ title: '📸 Photo Synced', description: 'Adenta Rise A — 2 photos uploaded from WhatsApp' });
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <div className="min-h-screen" style={{ backgroundColor: '#0C0C10' }} />;
  if (!user) return <Navigate to="/auth" replace />;

  const sidebarItems = [
    { key: 'overview' as AdminPage, label: 'Overview', icon: LayoutDashboard },
    { key: 'all-projects' as AdminPage, label: 'All Projects', icon: FolderKanban, badge: '9' },
    { key: 'clients' as AdminPage, label: 'Clients', icon: Users, badge: '9' },
    { key: 'payments' as AdminPage, label: 'Payments', icon: CreditCard, alert: true },
    { key: 'risks' as AdminPage, label: 'Risk Register', icon: AlertTriangle, alert: true },
  ];

  const opsItems = [
    { key: 'automation' as AdminPage, label: 'Automation', icon: Zap, badge: '12' },
    { key: 'reports' as AdminPage, label: 'Reports', icon: FileBarChart },
  ];

  const cmdItems = [
    { label: 'Overview', sub: 'Admin projects dashboard', action: () => setActivePage('overview') },
    { label: 'All Projects', sub: 'Table view', action: () => setActivePage('all-projects') },
    { label: 'Clients', sub: '9 clients roster', action: () => setActivePage('clients') },
    { label: 'Risk Register', sub: '7 open risks', action: () => setActivePage('risks') },
    { label: 'Automation Engine', sub: '12 rules', action: () => setActivePage('automation') },
    { label: 'Reports', sub: 'Financial & operational', action: () => setActivePage('reports') },
  ];

  const filteredCmd = cmdItems.filter(i =>
    i.label.toLowerCase().includes(cmdSearch.toLowerCase()) ||
    i.sub.toLowerCase().includes(cmdSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0C0C10', color: '#E0E0E8' }}>
      {/* Sidebar */}
      <aside className="w-[240px] fixed left-0 top-0 h-screen flex flex-col border-r border-white/5" style={{ backgroundColor: '#111118' }}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#00C47D] flex items-center justify-center text-white font-bold text-xs">FR</div>
            <div>
              <p className="text-xs font-bold tracking-wider">FLEXIRENTS</p>
              <p className="text-[10px] text-white/30">Projects Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-white/20 px-4 mb-2">Projects</p>
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <button key={item.key} onClick={() => setActivePage(item.key)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                  isActive ? 'bg-[#00C47D]/10 text-[#00C47D] border-r-2 border-[#00C47D]' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                <div className="flex items-center gap-2.5"><Icon className="h-4 w-4" />{item.label}</div>
                {item.badge && <Badge className="bg-white/10 text-white/50 border-0 text-[10px] px-1.5">{item.badge}</Badge>}
                {item.alert && <span className="w-2 h-2 rounded-full bg-red-500" />}
              </button>
            );
          })}
          <div className="border-t border-white/5 my-3 mx-4" />
          <p className="text-[10px] uppercase tracking-wider text-white/20 px-4 mb-2">Operations</p>
          {opsItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <button key={item.key} onClick={() => setActivePage(item.key)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                  isActive ? 'bg-[#00C47D]/10 text-[#00C47D] border-r-2 border-[#00C47D]' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                <div className="flex items-center gap-2.5"><Icon className="h-4 w-4" />{item.label}</div>
                {item.badge && <Badge className="bg-white/10 text-white/50 border-0 text-[10px] px-1.5">{item.badge}</Badge>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="ml-[240px] flex-1 min-h-screen">
        {/* Topbar */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-white/5" style={{ backgroundColor: '#0C0C10' }}>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <span>PROJECTS</span><ChevronRight className="h-3 w-3" />
            <span className="text-white/60 uppercase">{activePage.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-[#00C47D]/15 text-[#00C47D] border-[#00C47D]/30 text-[10px] gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C47D] animate-pulse" /> LIVE
            </Badge>
            <span className="font-mono text-xs text-white/40">{clock.toLocaleTimeString()}</span>
            <Button size="sm" variant="outline" onClick={() => setCmdOpen(true)}
              className="h-7 text-xs border-white/10 text-white/40 hover:text-white gap-1">
              <Command className="h-3 w-3" /> K
            </Button>
          </div>
        </div>

        <div className="p-6">
          {activePage === 'overview' && <AdminOverview />}
          {activePage === 'all-projects' && <AdminAllProjects />}
          {activePage === 'clients' && <AdminClients />}
          {activePage === 'payments' && <AdminPaymentsView />}
          {activePage === 'risks' && <AdminRiskRegister />}
          {activePage === 'automation' && <AdminAutomation />}
          {activePage === 'reports' && <AdminReports />}
        </div>
      </main>

      {/* Command Palette */}
      <Dialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <DialogContent className="max-w-[560px] p-0 gap-0 border-white/10" style={{ backgroundColor: '#111118' }}>
          <div className="p-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-white/30" />
              <Input
                placeholder="Search commands..."
                value={cmdSearch}
                onChange={e => setCmdSearch(e.target.value)}
                className="border-0 bg-transparent text-white focus-visible:ring-0 h-8 p-0"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredCmd.map((item, i) => (
              <button key={i} onClick={() => { item.action(); setCmdOpen(false); setCmdSearch(''); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-white/5 text-left">
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white/30" />
                </div>
                <div>
                  <p className="text-sm text-white/80">{item.label}</p>
                  <p className="text-[10px] text-white/30">{item.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Overview ───────────────────────────────────────────────
const AdminOverview = () => {
  const { data: projects = [] } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => { const response = await api.get('/api/admin/construction-projects'); return response.data || []; },
  });
  const { data: risks = [] } = useQuery({
    queryKey: ['admin-risks'],
    queryFn: async () => { const response = await api.get('/api/admin/project-risks'); return response.data || []; },
  });
  const { data: events = [] } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => { const response = await api.get('/api/admin/project-automation-events', { params: { orderBy: 'timestamp', orderDirection: 'desc', limit: 8 } }); return response.data || []; },
  });
  const { data: clients = [] } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => { const response = await api.get('/api/admin/project-clients'); return response.data || []; },
  });

  const totalBudget = projects.reduce((s, p) => s + Number(p.budget_ghs), 0);
  const totalSpent = projects.reduce((s, p) => s + Number(p.spent_ghs), 0);
  const avgProgress = projects.length ? Math.round(projects.reduce((s, p) => s + p.overall_percent, 0) / projects.length) : 0;
  const openRisks = risks.filter(r => r.status !== 'resolved').length;

  const metrics = [
    { label: 'Pipeline Value', value: `₵${(totalBudget / 1_000_000).toFixed(1)}M`, color: '#00C47D', trend: '+12%' },
    { label: 'Disbursed', value: `₵${(totalSpent / 1_000_000).toFixed(1)}M`, color: '#F5A623', trend: null },
    { label: 'Avg Progress', value: `${avgProgress}%`, color: '#4D9EFF', trend: '+3%' },
    { label: 'Open Risks', value: openRisks.toString(), color: '#FF4D4D', trend: null },
    { label: 'Clients', value: clients.length.toString(), color: '#9B7FFF', trend: null },
    { label: 'NPS', value: '4.8', color: '#E0E0E8', trend: '+0.2' },
  ];

  const chartData = projects.filter(p => p.status !== 'complete').map(p => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    budget: Number(p.budget_ghs) / 1000,
    spent: Number(p.spent_ghs) / 1000,
  }));

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map(m => (
          <Card key={m.label} className="border-0 overflow-hidden" style={{ backgroundColor: '#111118' }}>
            <div className="h-0.5" style={{ backgroundColor: m.color }} />
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/30">{m.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: m.color }}>{m.value}</p>
              {m.trend && <p className="text-[10px] text-[#00C47D] mt-0.5 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" />{m.trend}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Table + Charts */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-0" style={{ backgroundColor: '#111118' }}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-white/60">Active Projects</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-white/5 text-white/30">
                  <th className="text-left p-3">Project</th><th className="text-left p-3">Phase</th><th className="text-left p-3">Progress</th><th className="text-left p-3">Status</th>
                </tr></thead>
                <tbody>
                  {projects.slice(0, 6).map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer">
                      <td className="p-3">
                        <p className="text-white/80 font-medium">{p.name}</p>
                        <p className="text-white/30 text-[10px]">{p.neighbourhood} · {p.type}</p>
                      </td>
                      <td className="p-3 font-mono text-white/50">Ph.{p.current_phase}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00C47D] rounded-full" style={{ width: `${p.overall_percent}%` }} />
                          </div>
                          <span className="font-mono text-white/50">{p.overall_percent}%</span>
                        </div>
                      </td>
                      <td className="p-3"><ProjectStatusBadge status={p.status as any} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Budget Chart */}
          <Card className="border-0" style={{ backgroundColor: '#111118' }}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-white/60">Budget vs Spent (₵ thousands)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  <Bar dataKey="budget" fill="#4D9EFF" radius={[4,4,0,0]} />
                  <Bar dataKey="spent" fill="#00C47D" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right: Activity + Risks + Payments */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0" style={{ backgroundColor: '#111118' }}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-white/60">Live Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {events.map(e => (
                <div key={e.id} className="flex gap-2 items-start">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${e.success ? 'bg-[#00C47D]/20 text-[#00C47D]' : 'bg-red-500/20 text-red-400'}`}>
                    <Zap className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70">{e.description}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <AutomationTag />
                      <span className="text-[10px] text-white/20">{new Date(e.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0" style={{ backgroundColor: '#111118' }}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-white/60">Critical Risks</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {risks.filter(r => r.level === 'critical').map(r => (
                <div key={r.id} className="p-2 rounded bg-red-500/5 border border-red-500/10">
                  <p className="text-xs text-red-400 font-medium">{r.title}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{r.mitigation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── All Projects ───────────────────────────────────────────
const AdminAllProjects = () => {
  const { data: projects = [] } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => { const response = await api.get('/api/admin/construction-projects'); return response.data || []; },
  });
  const { data: clients = [] } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => { const response = await api.get('/api/admin/project-clients'); return response.data || []; },
  });

  const getClient = (id: string | null) => clients.find(c => c.id === id);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white/80">All Projects</h2>
      <Card className="border-0" style={{ backgroundColor: '#111118' }}>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/5 text-white/30">
              <th className="text-left p-3">Project</th><th className="text-left p-3">Type</th><th className="text-left p-3">Location</th>
              <th className="text-left p-3">Phase</th><th className="text-left p-3">Progress</th><th className="text-left p-3">Budget</th>
              <th className="text-left p-3">Spent</th><th className="text-left p-3">Client</th><th className="text-left p-3">ETA</th><th className="text-left p-3">Status</th>
            </tr></thead>
            <tbody>
              {projects.map(p => {
                const client = getClient(p.client_id);
                const spentPct = p.budget_ghs > 0 ? (Number(p.spent_ghs) / Number(p.budget_ghs)) * 100 : 0;
                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 text-white/80 font-medium">{p.name}</td>
                    <td className="p-3"><Badge className="bg-white/5 text-white/50 border-0 text-[10px]">{p.type}</Badge></td>
                    <td className="p-3 text-white/50">{p.neighbourhood}</td>
                    <td className="p-3 font-mono text-white/50">Ph.{p.current_phase}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00C47D] rounded-full" style={{ width: `${p.overall_percent}%` }} />
                        </div>
                        <span className="font-mono text-white/50">{p.overall_percent}%</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-white/50">₵{(Number(p.budget_ghs) / 1000).toFixed(0)}k</td>
                    <td className="p-3 font-mono" style={{ color: spentPct > 80 ? '#FF4D4D' : spentPct > 50 ? '#F5A623' : '#00C47D' }}>₵{(Number(p.spent_ghs) / 1000).toFixed(0)}k</td>
                    <td className="p-3 text-white/60">{client ? `${client.flag} ${client.name}` : '—'}</td>
                    <td className="p-3 font-mono text-white/40">{p.estimated_completion || '—'}</td>
                    <td className="p-3"><ProjectStatusBadge status={p.status as any} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Clients ────────────────────────────────────────────────
const AdminClients = () => {
  const { data: clients = [] } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => { const response = await api.get('/api/admin/project-clients'); return response.data || []; },
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => { const response = await api.get('/api/admin/construction-projects'); return response.data || []; },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white/80">Clients ({clients.length})</h2>
      <div className="space-y-2">
        {clients.map(c => {
          const clientProjects = projects.filter(p => p.client_id === c.id);
          const isOverdue = c.payment_status === 'overdue';
          return (
            <Card key={c.id} className={`border-0 ${isOverdue ? 'ring-1 ring-red-500/30' : ''}`} style={{ backgroundColor: '#111118' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: `hsl(${c.name.charCodeAt(0) * 7 % 360}, 50%, 30%)`, color: 'white' }}>
                  {c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white/80">{c.name}</p>
                    <span className="text-sm">{c.flag}</span>
                  </div>
                  <p className="text-[10px] text-white/30">{c.location} · {c.client_type.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  {clientProjects.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs">
                      <span className="text-white/50">{p.name}</span>
                      <span className="font-mono text-white/30">{p.overall_percent}%</span>
                    </div>
                  ))}
                </div>
                <Badge className={`text-[10px] ${c.portal_active ? 'bg-[#00C47D]/15 text-[#00C47D]' : 'bg-white/5 text-white/30'}`}>
                  {c.portal_active ? 'Active' : 'Inactive'}
                </Badge>
                {isOverdue && <Badge className="bg-red-500/15 text-red-400 text-[10px]">Overdue</Badge>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ─── Payments ───────────────────────────────────────────────
const AdminPaymentsView = () => {
  const { data: payments = [] } = useQuery({
    queryKey: ['admin-all-payments'],
    queryFn: async () => { const response = await api.get('/api/admin/project-payments', { params: { orderBy: 'tranche_number' } }); return response.data || []; },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white/80">Payments</h2>
      <Card className="border-0" style={{ backgroundColor: '#111118' }}>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/5 text-white/30">
              <th className="text-left p-3">#</th><th className="text-left p-3">Phase</th><th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Status</th><th className="text-left p-3">Paid Via</th><th className="text-left p-3">Date</th>
            </tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="p-3 font-mono text-white/40">{p.tranche_number}</td>
                  <td className="p-3 text-white/70">{p.phase_name}</td>
                  <td className="p-3 font-mono text-white/80">₵{Number(p.amount_ghs).toLocaleString()}</td>
                  <td className="p-3">
                    <Badge className={`text-[10px] ${
                      p.status === 'paid' ? 'bg-[#00C47D]/15 text-[#00C47D]' :
                      p.status === 'active' ? 'bg-[#F5A623]/15 text-[#F5A623]' :
                      'bg-white/5 text-white/30'
                    }`}>{p.status}</Badge>
                  </td>
                  <td className="p-3 text-white/40">{p.paid_via || '—'}</td>
                  <td className="p-3 text-white/40">{p.paid_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Risk Register ──────────────────────────────────────────
const AdminRiskRegister = () => {
  const { data: risks = [] } = useQuery({
    queryKey: ['admin-risks'],
    queryFn: async () => { const response = await api.get('/api/admin/project-risks', { params: { orderBy: 'level' } }); return response.data || []; },
  });

  const levelColors: Record<string, string> = {
    critical: '#FF4D4D', high: '#F5A623', medium: '#4D9EFF', low: '#00C47D',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-white/80">Risk Register</h2>
        {['critical', 'high', 'medium', 'low'].map(l => (
          <Badge key={l} className="text-[10px]" style={{ backgroundColor: `${levelColors[l]}20`, color: levelColors[l] }}>
            {l}: {risks.filter(r => r.level === l).length}
          </Badge>
        ))}
      </div>
      <Card className="border-0" style={{ backgroundColor: '#111118' }}>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/5 text-white/30">
              <th className="text-left p-3">Risk</th><th className="text-left p-3">Level</th><th className="text-left p-3">Mitigation</th>
              <th className="text-left p-3">Owner</th><th className="text-left p-3">Auto</th><th className="text-left p-3">Status</th>
            </tr></thead>
            <tbody>
              {risks.map(r => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="p-3">
                    <p className="text-white/80 font-medium">{r.title}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{r.description}</p>
                  </td>
                  <td className="p-3">
                    <Badge className="text-[10px]" style={{ backgroundColor: `${levelColors[r.level]}20`, color: levelColors[r.level] }}>{r.level}</Badge>
                  </td>
                  <td className="p-3 text-white/50 max-w-[200px]">{r.mitigation}</td>
                  <td className="p-3 text-white/60">{r.owner}</td>
                  <td className="p-3">{r.auto_alert_enabled ? <AutomationTag label="AUTO ✓" /> : <span className="text-white/20 text-[10px]">Manual</span>}</td>
                  <td className="p-3">
                    <Badge className={`text-[10px] ${
                      r.status === 'active' ? 'bg-red-500/15 text-red-400' :
                      r.status === 'monitoring' ? 'bg-amber-500/15 text-amber-400' :
                      r.status === 'controlled' ? 'bg-blue-500/15 text-blue-400' :
                      'bg-green-500/15 text-green-400'
                    }`}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Automation ─────────────────────────────────────────────
const AdminAutomation = () => {
  const { data: rules = [] } = useQuery({
    queryKey: ['admin-automation-rules'],
    queryFn: async () => { const response = await api.get('/api/admin/project-automation-rules', { params: { orderBy: 'category' } }); return response.data || []; },
  });
  const { data: events = [] } = useQuery({
    queryKey: ['admin-automation-events'],
    queryFn: async () => { const response = await api.get('/api/admin/project-automation-events', { params: { orderBy: 'timestamp', orderDirection: 'desc', limit: 10 } }); return response.data || []; },
  });

  const activeRules = rules.filter(r => r.enabled).length;
  const totalFires = rules.reduce((s, r) => s + r.fire_count, 0);

  const categories = [...new Set(rules.map(r => r.category))];

  const channels = [
    { name: 'Email (SMTP)', status: 'connected' },
    { name: 'WhatsApp (Twilio)', status: 'connected' },
    { name: 'SMS (Hubtel)', status: 'connected' },
    { name: 'Wise Webhook', status: 'connected' },
    { name: 'Portal Push', status: 'connected' },
    { name: 'Slack', status: 'configuring' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white/80">Automation Engine</h2>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Rules Active', value: activeRules, color: '#00C47D' },
          { label: 'Events Today', value: 24, color: '#4D9EFF' },
          { label: 'Notifs Sent', value: 156, color: '#9B7FFF' },
          { label: 'Reports', value: 12, color: '#F5A623' },
          { label: 'Alerts', value: 7, color: '#FF4D4D' },
          { label: 'Uptime', value: '99.9%', color: '#00C47D' },
        ].map(m => (
          <Card key={m.label} className="border-0" style={{ backgroundColor: '#111118' }}>
            <div className="h-0.5" style={{ backgroundColor: m.color }} />
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/30">{m.label}</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: m.color }}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Rules */}
        <div className="space-y-4">
          {categories.map(cat => (
            <Card key={cat} className="border-0" style={{ backgroundColor: '#111118' }}>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-white/40 uppercase tracking-wider">{cat}</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {rules.filter(r => r.category === cat).map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 font-medium">{rule.name}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{rule.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[10px] text-white/20">{rule.fire_count}×</span>
                      <Switch checked={rule.enabled} className="data-[state=checked]:bg-[#00C47D]" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Events + Channels */}
        <div className="space-y-4">
          <Card className="border-0" style={{ backgroundColor: '#111118' }}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-white/60">Event Log</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {events.map(e => (
                <div key={e.id} className="flex gap-2 items-start p-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${e.success ? 'bg-[#00C47D]/20 text-[#00C47D]' : 'bg-red-500/20 text-red-400'}`}>
                    <Zap className="h-2.5 w-2.5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/60">{e.description}</p>
                    <span className="text-[10px] text-white/20">{new Date(e.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0" style={{ backgroundColor: '#111118' }}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-white/60">Notification Channels</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {channels.map(ch => (
                <div key={ch.name} className="flex items-center justify-between p-2">
                  <span className="text-xs text-white/60">{ch.name}</span>
                  <Badge className={`text-[10px] ${ch.status === 'connected' ? 'bg-[#00C47D]/15 text-[#00C47D]' : 'bg-[#F5A623]/15 text-[#F5A623]'}`}>
                    {ch.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── Reports ────────────────────────────────────────────────
const AdminReports = () => {
  const { data: projects = [] } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => { const response = await api.get('/api/admin/construction-projects'); return response.data || []; },
  });

  const chartData = projects.filter(p => p.status !== 'complete').map(p => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    budget: Number(p.budget_ghs) / 1000,
    spent: Number(p.spent_ghs) / 1000,
  }));

  const pieData = [
    { name: 'Active', value: projects.filter(p => p.status === 'active').length, color: '#00C47D' },
    { name: 'On Hold', value: projects.filter(p => p.status === 'hold').length, color: '#F5A623' },
    { name: 'Complete', value: projects.filter(p => p.status === 'complete').length, color: '#4D9EFF' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white/80">Reports</h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0" style={{ backgroundColor: '#111118' }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-white/60">Budget vs Spent</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                <Bar dataKey="budget" fill="#4D9EFF" radius={[4,4,0,0]} />
                <Bar dataKey="spent" fill="#00C47D" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0" style={{ backgroundColor: '#111118' }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-white/60">Project Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProjectsDashboard;
