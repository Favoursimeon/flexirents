import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { PhaseProgressBar } from "@/components/projects/PhaseProgressBar";
import { PhaseTimeline } from "@/components/projects/PhaseTimeline";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { AutomationTag } from "@/components/projects/AutomationTag";
import { ExpertDropdownBlock } from "@/components/projects/ExpertDropdownBlock";
import { getExpertsForUnitType, UnitType } from "@/data/projectExperts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Layers, CreditCard, FileText, Bell, PlusCircle,
  MapPin, Calendar, Download, Camera, AlertTriangle, FileCheck,
  ArrowRight, ChevronRight
} from "lucide-react";

type SubPage = 'dashboard' | 'phases' | 'payments' | 'documents' | 'updates' | 'submit';

const sidebarItems: { key: SubPage; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'phases', label: 'Phase Progress', icon: Layers },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'updates', label: 'Site Updates', icon: Bell },
  { key: 'submit', label: 'Submit New Project', icon: PlusCircle },
];

const ClientProjectsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [activePage, setActivePage] = useState<SubPage>('dashboard');
  const { toast } = useToast();

  if (authLoading) return <div className="min-h-screen bg-[#141210]" />;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#141210', color: '#E8E2D6' }}>
      {/* Sidebar */}
      <aside className="w-[250px] fixed left-0 top-0 h-screen flex flex-col border-r border-white/5" style={{ backgroundColor: '#1C1916' }}>
        <div className="p-5 border-b border-white/5">
          <div className="w-10 h-10 rounded-full bg-[#C8912A] flex items-center justify-center text-white font-bold text-sm mb-2">
            {user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <p className="font-semibold text-sm truncate">{user.email}</p>
          <Badge className="mt-1 bg-[#C8912A]/20 text-[#C8912A] border-[#C8912A]/30 text-[10px]">Portal Active</Badge>
        </div>
        <nav className="flex-1 py-4">
          {sidebarItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <div key={item.key}>
                {i === 5 && <div className="border-t border-white/5 my-3 mx-4" />}
                {i === 5 && <p className="text-[10px] uppercase tracking-wider text-white/30 px-4 mb-2">New Build</p>}
                <button
                  onClick={() => setActivePage(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive ? 'bg-[#C8912A]/15 text-[#C8912A] border-r-2 border-[#C8912A]' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="ml-[250px] flex-1 p-6 md:p-8 overflow-y-auto min-h-screen">
        {activePage === 'dashboard' && <ClientDashboard userId={user.id} />}
        {activePage === 'phases' && <ClientPhaseProgress userId={user.id} />}
        {activePage === 'payments' && <ClientPayments userId={user.id} />}
        {activePage === 'documents' && <ClientDocuments userId={user.id} />}
        {activePage === 'updates' && <ClientSiteUpdates userId={user.id} />}
        {activePage === 'submit' && <ClientSubmitProject userId={user.id} />}
      </main>
    </div>
  );
};

// ─── Dashboard ──────────────────────────────────────────────
const ClientDashboard = ({ userId }: { userId: string }) => {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['client-projects', userId],
    queryFn: async () => {
      const response = await api.get('/api/construction-projects', {
        params: { orderBy: 'created_at_desc', userId },
      });
      return response.data || [];
    },
  });

  const { data: updates = [] } = useQuery({
    queryKey: ['client-updates', userId],
    queryFn: async () => {
      const response = await api.get('/api/project-site-updates', {
        params: { orderBy: 'timestamp_desc', limit: 5, userId },
      });
      return response.data || [];
    },
  });

  const project = projects[0];

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 bg-white/5" />)}</div>;

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-serif font-bold mb-2">No Projects Yet</h2>
        <p className="text-white/50 text-sm">Submit a new project to get started.</p>
      </div>
    );
  }

  const budgetPaid = project.spent_ghs;
  const budgetRemaining = project.budget_ghs - project.spent_ghs;

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <Card className="border-0 overflow-hidden" style={{ backgroundColor: '#242018' }}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ProjectStatusBadge status={project.status as any} />
                <Badge className="bg-white/10 text-white/70 border-white/10 text-[10px]">{project.type}</Badge>
              </div>
              <h2 className="text-2xl font-serif font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#E8E2D6' }}>{project.name}</h2>
              <div className="flex items-center gap-1.5 text-white/50 text-sm mb-4">
                <MapPin className="h-3.5 w-3.5" /> {project.location}
              </div>
              <PhaseProgressBar
                currentPhase={project.current_phase}
                totalPhases={project.total_phases}
                phaseName={project.current_phase_name}
                percent={project.overall_percent}
              />
            </div>
            {/* Progress Ring */}
            <div className="flex items-center justify-center">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#C8912A" strokeWidth="8"
                    strokeDasharray={`${(project.overall_percent / 100) * 264} 264`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#C8912A]">{project.overall_percent}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Budget', value: `₵${(project.budget_ghs / 1000).toFixed(0)}k`, color: '#C8912A' },
          { label: 'Paid', value: `₵${(budgetPaid / 1000).toFixed(0)}k`, color: '#2EA878' },
          { label: 'Next Payment', value: 'Tranche 4', color: '#2D6FA8' },
          { label: 'Remaining', value: `₵${(budgetRemaining / 1000).toFixed(0)}k`, color: '#C44040' },
        ].map(m => (
          <Card key={m.label} className="border-0" style={{ backgroundColor: '#1C1916' }}>
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{m.label}</p>
              <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Feed */}
      <Card className="border-0" style={{ backgroundColor: '#1C1916' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white/80">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {updates.map(u => (
            <div key={u.id} className="flex gap-3 items-start">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                u.type === 'photos' ? 'bg-blue-500/20 text-blue-400' :
                u.type === 'payment' ? 'bg-green-500/20 text-green-400' :
                u.type === 'advisory' ? 'bg-amber-500/20 text-amber-400' :
                'bg-white/10 text-white/50'
              }`}>
                {u.type === 'photos' ? <Camera className="h-4 w-4" /> :
                 u.type === 'payment' ? <CreditCard className="h-4 w-4" /> :
                 u.type === 'advisory' ? <AlertTriangle className="h-4 w-4" /> :
                 <FileCheck className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white/80 truncate">{u.title}</p>
                  {u.auto_generated && <AutomationTag />}
                </div>
                <p className="text-xs text-white/40 mt-0.5">{new Date(u.timestamp).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card className="border-0" style={{ backgroundColor: '#1C1916' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white/80">What Happens Next</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { step: 'Roofing sheets installation', detail: 'Currently in progress — 65% complete' },
              { step: 'Phase 4 sign-off & inspection', detail: 'Tranche 4 payment triggered upon completion' },
              { step: 'MEP rough-in begins', detail: 'Electrical and plumbing first fix' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full border border-[#C8912A]/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[#C8912A]">{i + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{s.step}</p>
                  <p className="text-xs text-white/40">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Phase Progress ─────────────────────────────────────────
const ClientPhaseProgress = ({ userId }: { userId: string }) => {
  const { data: projects = [] } = useQuery({
    queryKey: ['client-projects', userId],
    queryFn: async () => {
      const response = await api.get('/api/construction-projects', { params: { userId } });
      return response.data || [];
    },
  });
  const project = projects[0];

  const { data: phases = [] } = useQuery({
    queryKey: ['client-phases', project?.id],
    enabled: !!project,
    queryFn: async () => {
      const response = await api.get(`/api/projects/${project!.id}/phases`, {
        params: { orderBy: 'number' },
      });
      return response.data || [];
    },
  });

  if (!project) return <p className="text-white/50">No project found.</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold" style={{ fontFamily: 'Georgia, serif' }}>Phase Progress</h2>
      <PhaseTimeline phases={phases.map(p => ({ ...p, status: p.status as any }))} />

      {/* Cost Breakdown */}
      <Card className="border-0" style={{ backgroundColor: '#1C1916' }}>
        <CardHeader><CardTitle className="text-sm text-white/80">Phase Cost Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {phases.map(p => (
              <div key={p.id} className="flex justify-between items-center text-sm">
                <span className={`${p.status === 'pending' ? 'text-white/30' : 'text-white/70'}`}>Ph.{p.number} · {p.name}</span>
                <span className="font-mono text-white/60">₵{p.budget_ghs.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="font-mono text-[#C8912A]">₵{phases.reduce((s, p) => s + Number(p.budget_ghs), 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-4 bg-[#C8912A]/10 border border-[#C8912A]/20 rounded p-3 text-xs text-[#C8912A]">
            💡 A 5% retention is held until 30 days post-handover to cover any snag list items.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Payments ───────────────────────────────────────────────
const ClientPayments = ({ userId }: { userId: string }) => {
  const { data: payments = [] } = useQuery({
    queryKey: ['client-payments', userId],
    queryFn: async () => {
      const response = await api.get('/api/project-payments', {
        params: { orderBy: 'tranche_number', userId },
      });
      return response.data || [];
    },
  });

  const paid = payments.filter(p => p.status === 'paid');
  const totalPaid = paid.reduce((s, p) => s + Number(p.amount_ghs), 0);
  const nextPayment = payments.find(p => p.status === 'active');
  const remaining = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount_ghs), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold" style={{ fontFamily: 'Georgia, serif' }}>Payments</h2>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Paid', value: `₵${(totalPaid / 1000).toFixed(0)}k`, color: '#2EA878' },
          { label: 'Next Due', value: nextPayment ? `₵${(Number(nextPayment.amount_ghs) / 1000).toFixed(0)}k` : '—', color: '#C8912A' },
          { label: 'Remaining', value: `₵${(remaining / 1000).toFixed(0)}k`, color: '#C44040' },
        ].map(m => (
          <Card key={m.label} className="border-0" style={{ backgroundColor: '#1C1916' }}>
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40">{m.label}</p>
              <p className="text-lg font-bold" style={{ color: m.color }}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0" style={{ backgroundColor: '#1C1916' }}>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-xs">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Phase</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Paid Via</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="p-3 font-mono text-white/50">{p.tranche_number}</td>
                  <td className="p-3 text-white/70">{p.phase_name}</td>
                  <td className="p-3 font-mono text-white/80">₵{Number(p.amount_ghs).toLocaleString()}</td>
                  <td className="p-3">
                    <Badge className={`text-[10px] ${
                      p.status === 'paid' ? 'bg-green-500/15 text-green-400 border-green-500/20' :
                      p.status === 'active' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                      'bg-white/5 text-white/30 border-white/10'
                    }`}>{p.status}</Badge>
                  </td>
                  <td className="p-3 text-white/40 text-xs">{p.paid_via || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Remittance Guide */}
      <Card className="border-0" style={{ backgroundColor: '#1C1916' }}>
        <CardHeader><CardTitle className="text-sm text-white/80">Diaspora Remittance Guide</CardTitle></CardHeader>
        <CardContent className="text-xs text-white/60 space-y-2">
          <p>We accept payments via:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li><strong className="text-white/80">Wise (TransferWise)</strong> — fastest, lowest fees. Send to our GHS account.</li>
            <li><strong className="text-white/80">Remitly</strong> — good for USD/GBP → GHS.</li>
            <li><strong className="text-white/80">SWIFT bank transfer</strong> — for larger amounts.</li>
          </ul>
          <p>After sending, email your confirmation to <strong className="text-[#C8912A]">payments@flexirents.com</strong> and we'll verify within 2 hours.</p>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Documents ──────────────────────────────────────────────
const ClientDocuments = ({ userId }: { userId: string }) => {
  const { data: docs = [] } = useQuery({
    queryKey: ['client-documents', userId],
    queryFn: async () => {
      const response = await api.get('/api/project-documents', {
        params: { orderBy: 'uploaded_at_desc', userId },
      });
      return response.data || [];
    },
  });

  const certificates = docs.filter(d => ['certificate', 'report', 'contract'].includes(d.type));
  const receipts = docs.filter(d => ['receipt', 'photos', 'digest'].includes(d.type));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold" style={{ fontFamily: 'Georgia, serif' }}>Documents</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0" style={{ backgroundColor: '#1C1916' }}>
          <CardHeader><CardTitle className="text-sm text-white/80">Certificates & Reports</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {certificates.map(d => (
              <div key={d.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-sm text-white/80">{d.name}</p>
                    <p className="text-[10px] text-white/30">{d.size_kb > 0 ? `${d.size_kb} KB` : ''} · {new Date(d.uploaded_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/40 hover:text-white">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {certificates.length === 0 && <p className="text-xs text-white/30">No certificates yet.</p>}
          </CardContent>
        </Card>

        <Card className="border-0" style={{ backgroundColor: '#1C1916' }}>
          <CardHeader><CardTitle className="text-sm text-white/80">Receipts & Photos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {receipts.map(d => (
              <div key={d.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5">
                <div className="flex items-center gap-2">
                  {d.type === 'photos' ? <Camera className="h-4 w-4 text-purple-400" /> : <FileCheck className="h-4 w-4 text-green-400" />}
                  <div>
                    <p className="text-sm text-white/80">{d.name}</p>
                    <p className="text-[10px] text-white/30">{d.size_kb > 0 ? `${(d.size_kb / 1024).toFixed(1)} MB` : ''} · {new Date(d.uploaded_at).toLocaleDateString()}</p>
                  </div>
                  {d.auto_generated && <AutomationTag />}
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/40 hover:text-white">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {receipts.length === 0 && <p className="text-xs text-white/30">No receipts yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─── Site Updates ───────────────────────────────────────────
const ClientSiteUpdates = ({ userId }: { userId: string }) => {
  const { data: updates = [] } = useQuery({
    queryKey: ['client-site-updates', userId],
    queryFn: async () => {
      const response = await api.get('/api/project-site-updates', {
        params: { orderBy: 'timestamp_desc', userId },
      });
      return response.data || [];
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold" style={{ fontFamily: 'Georgia, serif' }}>Site Updates</h2>
      <div className="space-y-4">
        {updates.map(u => (
          <Card key={u.id} className="border-0" style={{ backgroundColor: '#1C1916' }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  u.type === 'photos' ? 'bg-blue-500/20 text-blue-400' :
                  u.type === 'payment' ? 'bg-green-500/20 text-green-400' :
                  u.type === 'advisory' ? 'bg-amber-500/20 text-amber-400' :
                  u.type === 'completion' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-white/10 text-white/50'
                }`}>
                  {u.type === 'photos' ? <Camera className="h-5 w-5" /> :
                   u.type === 'payment' ? <CreditCard className="h-5 w-5" /> :
                   u.type === 'advisory' ? <AlertTriangle className="h-5 w-5" /> :
                   <FileCheck className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white/90">{u.title}</h3>
                    {u.auto_generated && <AutomationTag />}
                  </div>
                  <p className="text-xs text-white/40 mb-2">{new Date(u.timestamp).toLocaleString()} · {u.author}</p>
                  <p className="text-sm text-white/60">{u.body}</p>
                  {u.photo_urls && u.photo_urls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {u.photo_urls.map((url: string, i: number) => (
                        <img key={i} src={url} alt="" className="rounded-lg h-20 w-full object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {updates.length === 0 && <p className="text-white/30 text-sm">No updates yet.</p>}
      </div>
    </div>
  );
};

// ─── Submit New Project ─────────────────────────────────────
const ClientSubmitProject = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    projectName: '', unitType: '3bed' as UnitType, landOwnership: 'owned',
    budgetRange: '', completionTarget: '', designStyle: '', finishesLevel: 'standard', specialRequirements: '',
  });
  const [expertSelections, setExpertSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const expertGroups = getExpertsForUnitType(form.unitType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/project-submissions', {
        user_id: userId,
        project_name: form.projectName,
        unit_type: form.unitType,
        land_ownership: form.landOwnership,
        budget_range: form.budgetRange,
        completion_target: form.completionTarget,
        design_style: form.designStyle,
        finishes_level: form.finishesLevel,
        special_requirements: form.specialRequirements,
        expert_selections: expertSelections,
      });
      toast({ title: 'Project Submitted', description: 'We\'ll review your submission within 48 hours.' });
      setForm({ projectName: '', unitType: '3bed', landOwnership: 'owned', budgetRange: '', completionTarget: '', designStyle: '', finishesLevel: 'standard', specialRequirements: '' });
      setExpertSelections({});
    } catch {
      toast({ title: 'Error', description: 'Failed to submit. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold" style={{ fontFamily: 'Georgia, serif' }}>Submit New Project</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-4">
            <Card className="border-0" style={{ backgroundColor: '#1C1916' }}>
              <CardHeader><CardTitle className="text-sm text-white/80">Project Basics</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Project Name" value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} required className="bg-white/5 border-white/10 text-white" />
                <Select value={form.unitType} onValueChange={(v: UnitType) => setForm(f => ({ ...f, unitType: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1bed">1-Bedroom</SelectItem>
                    <SelectItem value="2bed">2-Bedroom</SelectItem>
                    <SelectItem value="3bed">3-Bedroom</SelectItem>
                    <SelectItem value="4plus">4+ Bedroom / Custom</SelectItem>
                    <SelectItem value="commercial">Commercial / Office</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.landOwnership} onValueChange={v => setForm(f => ({ ...f, landOwnership: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">I own the land</SelectItem>
                    <SelectItem value="purchasing">Purchasing land</SelectItem>
                    <SelectItem value="need_land">Need help finding land</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Budget Range (e.g. GH₵300k–500k)" value={form.budgetRange} onChange={e => setForm(f => ({ ...f, budgetRange: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                <Input placeholder="Target Completion (e.g. Dec 2027)" value={form.completionTarget} onChange={e => setForm(f => ({ ...f, completionTarget: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
              </CardContent>
            </Card>

            <Card className="border-0" style={{ backgroundColor: '#1C1916' }}>
              <CardHeader><CardTitle className="text-sm text-white/80">Design Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Design Style (e.g. Modern, Traditional)" value={form.designStyle} onChange={e => setForm(f => ({ ...f, designStyle: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                <Select value={form.finishesLevel} onValueChange={v => setForm(f => ({ ...f, finishesLevel: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Special Requirements..." value={form.specialRequirements} onChange={e => setForm(f => ({ ...f, specialRequirements: e.target.value }))} className="bg-white/5 border-white/10 text-white min-h-[80px]" />
              </CardContent>
            </Card>

            <Button type="submit" disabled={submitting || !form.projectName} className="w-full bg-[#C8912A] hover:bg-[#7A5618] text-white">
              {submitting ? 'Submitting...' : 'Submit Project for Review'}
            </Button>
          </div>

          {/* Right: Expert Dropdowns */}
          <div className="space-y-3">
            <p className="text-sm text-white/50 mb-2">Select expert preferences for each construction phase:</p>
            {expertGroups.map((group, i) => (
              <ExpertDropdownBlock
                key={group.label}
                phaseGroup={group}
                phaseIndex={i}
                selections={expertSelections}
                onSelectionChange={(name, val) => setExpertSelections(s => ({ ...s, [name]: val }))}
              />
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClientProjectsPage;
