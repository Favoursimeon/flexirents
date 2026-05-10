import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { PhaseProgressBar } from "@/components/projects/PhaseProgressBar";
import { PhaseTimeline } from "@/components/projects/PhaseTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, Calendar, Users, CheckCircle, HardHat, Zap, Paintbrush, Home, Shield, Award, ArrowRight } from "lucide-react";

type FilterType = 'all' | 'active' | 'hold' | 'complete' | '3bed' | '2bed' | '1bed' | '4plus' | 'commercial' | 'accra' | 'tema' | 'kumasi';

const filterPills: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All Projects' },
  { key: 'active', label: 'Active' },
  { key: 'hold', label: 'On Hold' },
  { key: 'complete', label: 'Completed' },
  { key: '3bed', label: '3-Bed' },
  { key: '2bed', label: '2-Bed' },
  { key: '1bed', label: '1-Bed' },
  { key: '4plus', label: '4+ Bed' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'accra', label: 'Accra' },
  { key: 'tema', label: 'Tema' },
  { key: 'kumasi', label: 'Kumasi' },
];

const expertiseGroups = [
  {
    phase: 'Ground & Foundation',
    icon: <HardHat className="h-6 w-6" />,
    experts: ['Land Surveyors', 'Geotechnical Engineers', 'Quantity Surveyors', 'Town Planners'],
  },
  {
    phase: 'Structure & Roof',
    icon: <Building2 className="h-6 w-6" />,
    experts: ['Structural Engineers', 'Masons & Block Layers', 'Roofing Contractors', 'Timber/Steel Specialists'],
  },
  {
    phase: 'MEP & Plaster',
    icon: <Zap className="h-6 w-6" />,
    experts: ['Electrical Engineers', 'Licensed Plumbers', 'MEP Inspectors', 'Plasterers & Renderers'],
  },
  {
    phase: 'Finishes & Handover',
    icon: <Paintbrush className="h-6 w-6" />,
    experts: ['Interior Fit-out Teams', 'Tilers & Painters', 'HVAC Technicians', 'Landscaping Contractors'],
  },
];

const Projects = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryData, setEnquiryData] = useState({ name: '', email: '', location: '', projectType: '', buildLocation: '', budgetRange: '' });
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['public-projects'],
    queryFn: async () => {
      const response = await api.get('/api/construction-projects', {
        params: { is_public: true, orderBy: 'created_at_desc' },
      });
      return response.data || [];
    },
  });

  const { data: allPhases = [] } = useQuery({
    queryKey: ['public-project-phases'],
    queryFn: async () => {
      const response = await api.get('/api/project-phases', {
        params: { orderBy: 'number' },
      });
      return response.data || [];
    },
  });

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') return projects;
    if (['active', 'hold', 'complete'].includes(activeFilter))
      return projects.filter(p => p.status === activeFilter);
    if (['1bed', '2bed', '3bed', '4plus', 'commercial'].includes(activeFilter))
      return projects.filter(p => p.type === activeFilter);
    if (['accra', 'tema', 'kumasi'].includes(activeFilter))
      return projects.filter(p => p.neighbourhood.toLowerCase().includes(activeFilter) || p.location.toLowerCase().includes(activeFilter));
    return projects;
  }, [projects, activeFilter]);

  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'complete');
  const featuredProject = activeProjects[0];
  const featuredPhases = allPhases.filter(p => p.project_id === featuredProject?.id);

  const stats = {
    completed: completedProjects.length,
    active: activeProjects.length,
    diaspora: 9,
    rating: 4.8,
  };

  const typeBadge = (type: string) => {
    const labels: Record<string, string> = { '1bed': '1-Bed', '2bed': '2-Bed', '3bed': '3-Bed', '4plus': '4+ Bed', 'commercial': 'Commercial' };
    return labels[type] || type;
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Enquiry Submitted', description: 'Our team will be in touch within 48 hours.' });
    setShowEnquiry(false);
    setEnquiryData({ name: '', email: '', location: '', projectType: '', buildLocation: '', budgetRange: '' });
  };

  // Prestige color palette
  const navy = '#0F1D2F';
  const navyLight = '#1A2D45';
  const champagne = '#C9A96E';
  const champagneLight = '#D4BA85';
  const ivory = '#FAF8F5';
  const ivoryDark = '#F0EDE8';
  const slate = '#3A4A5C';

  return (
    <div className="min-h-screen" style={{ backgroundColor: ivory }}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden" style={{ background: `linear-gradient(170deg, ${navy} 0%, ${navyLight} 60%, ${slate} 100%)` }}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <Shield className="h-4 w-4" style={{ color: champagne }} />
            <span className="text-xs tracking-widest uppercase text-white/60 font-medium">Trusted Since 2019</span>
            <Award className="h-4 w-4" style={{ color: champagne }} />
          </div>

          <h1
            className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-tight text-white mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif", letterSpacing: '-0.02em' }}
          >
            Crafting Exceptional Homes<br />
            <span style={{ color: champagne }}>Across Ghana</span>
          </h1>
          <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            From foundation to handover — every phase managed with precision, transparency, and an uncompromising commitment to quality.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-0">
            {[
              { value: stats.completed, label: 'Delivered' },
              { value: stats.active, label: 'In Progress' },
              { value: stats.diaspora, label: 'Diaspora Clients' },
              { value: `${stats.rating}`, label: 'Client Rating' },
            ].map((s, i) => (
              <div key={s.label} className={`text-center px-8 py-4 ${i < 3 ? 'border-r border-white/10' : ''}`}>
                <div className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{s.value}</div>
                <div className="text-[11px] uppercase tracking-widest text-white/40 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider accent */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, ${champagne}, transparent)` }} />

      {/* Sticky Filter Pills */}
      <div className="sticky top-16 z-30 backdrop-blur-md border-b py-3" style={{ backgroundColor: `${ivory}ee`, borderColor: `${navy}10` }}>
        <div className="container mx-auto px-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {filterPills.map(pill => (
              <button
                key={pill.key}
                onClick={() => setActiveFilter(pill.key)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={activeFilter === pill.key ? {
                  backgroundColor: navy,
                  color: champagneLight,
                } : {
                  backgroundColor: 'white',
                  color: slate,
                  border: `1px solid ${navy}15`,
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Project Banner */}
      {featuredProject && (
        <section className="py-14 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: navy }}>
              <div className="grid md:grid-cols-5 gap-0">
                <div className="md:col-span-3 p-8 md:p-12">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[11px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: `${champagne}20`, color: champagne }}>
                      Featured Project
                    </span>
                    <ProjectStatusBadge status={featuredProject.status as any} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {featuredProject.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-white/50 text-sm mb-5">
                    <MapPin className="h-4 w-4" /> {featuredProject.neighbourhood}
                  </div>
                  <p className="text-white/50 text-sm mb-8 max-w-md leading-relaxed">{featuredProject.public_description}</p>
                  <div className="mb-5">
                    <PhaseProgressBar
                      currentPhase={featuredProject.current_phase}
                      totalPhases={featuredProject.total_phases}
                      phaseName={featuredProject.current_phase_name}
                      percent={featuredProject.overall_percent}
                    />
                  </div>
                  <div className="flex gap-6 text-sm text-white/40">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" style={{ color: champagne }} />
                      ETA: {featuredProject.estimated_completion}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className="text-[10px] border-0" style={{ backgroundColor: `${champagne}15`, color: champagne }}>
                        {typeBadge(featuredProject.type)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 p-8 md:p-10 border-l" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: `${navyLight}` }}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-5" style={{ color: champagne }}>Phase Tracker</h3>
                  {featuredPhases.length > 0 ? (
                    <PhaseTimeline phases={featuredPhases.map(p => ({ ...p, status: p.status as any }))} compact />
                  ) : (
                    <div className="space-y-3">
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <div key={n} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            n < featuredProject.current_phase ? 'text-white' : n === featuredProject.current_phase ? 'text-white' : 'text-white/30'
                          }`} style={{
                            backgroundColor: n < featuredProject.current_phase ? champagne : n === featuredProject.current_phase ? champagneLight : `${navy}`,
                            border: n >= featuredProject.current_phase ? '1px solid rgba(255,255,255,0.1)' : 'none',
                          }}>
                            {n < featuredProject.current_phase ? '✓' : n}
                          </div>
                          <span className={`text-xs ${n <= featuredProject.current_phase ? 'text-white/80' : 'text-white/30'}`}>
                            Phase {n}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Project Cards Grid */}
      <section className="py-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: navy }}>
                {activeFilter === 'all' ? 'Our Portfolio' : `${filterPills.find(p => p.key === activeFilter)?.label}`}
              </h2>
              <p className="text-sm" style={{ color: `${slate}90` }}>
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <Card
                  key={project.id}
                  className="overflow-hidden cursor-pointer group transition-all duration-300 border-0 hover:-translate-y-1"
                  style={{ boxShadow: '0 2px 20px -4px rgba(15,29,47,0.08)' }}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="h-32 p-5 flex flex-col justify-between relative overflow-hidden" style={{
                    background: project.status === 'active'
                      ? `linear-gradient(135deg, ${navy} 0%, ${navyLight} 100%)`
                      : project.status === 'hold'
                      ? `linear-gradient(135deg, #5C4A1E 0%, #3A2F14 100%)`
                      : `linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)`,
                  }}>
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5" style={{
                      background: `radial-gradient(circle, ${champagne}, transparent 70%)`,
                      transform: 'translate(30%, -30%)',
                    }} />
                    <div className="flex justify-between relative z-10">
                      <ProjectStatusBadge status={project.status as any} className="bg-white/10 border-white/20 text-white" />
                      <Badge className="text-[10px] border-0" style={{ backgroundColor: `${champagne}20`, color: champagneLight }}>
                        {typeBadge(project.type)}
                      </Badge>
                    </div>
                    <Home className="h-8 w-8 text-white/10 relative z-10" />
                  </div>
                  <div className="p-5 bg-white">
                    <h3 className="font-semibold text-sm mb-1" style={{ color: navy }}>{project.name}</h3>
                    <div className="flex items-center gap-1 text-xs mb-4" style={{ color: `${slate}80` }}>
                      <MapPin className="h-3 w-3" /> {project.neighbourhood}
                    </div>
                    <PhaseProgressBar
                      currentPhase={project.current_phase}
                      totalPhases={project.total_phases}
                      phaseName={project.current_phase_name}
                      percent={project.overall_percent}
                      compact
                    />
                    <div className="flex justify-between items-center mt-4 pt-3 text-xs border-t" style={{ borderColor: `${navy}08`, color: `${slate}70` }}>
                      <span>Phase {project.current_phase} · {project.current_phase_name}</span>
                      {project.estimated_completion && <span>ETA {project.estimated_completion}</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Expert Network Strip */}
      <section className="py-20 px-4" style={{ background: `linear-gradient(170deg, ${navy} 0%, ${navyLight} 100%)` }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <span className="text-[11px] uppercase tracking-widest font-semibold block mb-3" style={{ color: champagne }}>Our Network</span>
            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Expert Professionals
            </h2>
            <p className="text-white/40 text-sm max-w-md mx-auto">
              Every phase of your project is overseen by vetted, experienced specialists.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {expertiseGroups.map(group => (
              <div key={group.phase} className="rounded-xl p-6 border transition-all hover:border-white/15" style={{ backgroundColor: `${navyLight}`, borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="mb-4" style={{ color: champagne }}>{group.icon}</div>
                <h3 className="font-semibold text-sm text-white mb-4">{group.phase}</h3>
                <ul className="space-y-2.5">
                  {group.experts.map(e => (
                    <li key={e} className="text-xs text-white/50 flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 flex-shrink-0" style={{ color: champagne }} /> {e}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <section className="py-14 px-4" style={{ backgroundColor: ivoryDark }}>
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: navy }}>
              Successfully Delivered
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {completedProjects.map(project => (
                <div key={project.id} className="flex items-center gap-4 bg-white rounded-xl p-5 border transition-all hover:shadow-md" style={{ borderColor: `${navy}08` }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${champagne}15` }}>
                    <CheckCircle className="h-5 w-5" style={{ color: champagne }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm" style={{ color: navy }}>{project.name}</h3>
                    <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: `${slate}80` }}>
                      <span>{project.neighbourhood}</span>
                      <span className="opacity-40">•</span>
                      <span>{typeBadge(project.type)}</span>
                      <span className="opacity-40">•</span>
                      <span>Delivered {project.estimated_completion}</span>
                    </div>
                  </div>
                  <ProjectStatusBadge status="complete" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-20 px-4 relative overflow-hidden" style={{ backgroundColor: navy }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <span className="text-[11px] uppercase tracking-widest font-semibold block mb-4" style={{ color: champagne }}>
            Begin Your Journey
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Ready to Build Something<br />
            <span style={{ color: champagne }}>Extraordinary?</span>
          </h2>
          <p className="text-white/40 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            From bespoke 1-bedroom residences to premium commercial complexes — start your construction journey with confidence.
          </p>
          <Button
            size="lg"
            onClick={() => setShowEnquiry(true)}
            className="border-0 font-semibold px-8 gap-2 text-sm tracking-wide"
            style={{ backgroundColor: champagne, color: navy }}
          >
            Start a Project <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Privacy ribbon */}
      <div className="py-3 text-center text-xs" style={{ backgroundColor: ivoryDark, color: `${slate}80` }}>
        <Shield className="h-3 w-3 inline mr-1.5 opacity-50" />
        Client names, financial details, and addresses are kept strictly confidential.
      </div>

      {/* Project Detail Modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-lg border-0 shadow-2xl" style={{ backgroundColor: ivory }}>
          <DialogHeader>
            <DialogTitle className="font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: navy }}>
              {selectedProject?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <ProjectStatusBadge status={selectedProject.status} />
                <Badge variant="outline" className="text-xs">{typeBadge(selectedProject.type)}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: `${slate}90` }}>
                <MapPin className="h-4 w-4" /> {selectedProject.neighbourhood}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: `${slate}90` }}>{selectedProject.public_description}</p>
              <PhaseProgressBar
                currentPhase={selectedProject.current_phase}
                totalPhases={selectedProject.total_phases}
                phaseName={selectedProject.current_phase_name}
                percent={selectedProject.overall_percent}
              />
              {selectedProject.estimated_completion && (
                <div className="text-sm flex items-center gap-1" style={{ color: `${slate}80` }}>
                  <Calendar className="h-3.5 w-3.5" style={{ color: champagne }} />
                  Estimated completion: {selectedProject.estimated_completion}
                </div>
              )}
              <div className="rounded-lg p-3 text-xs border" style={{ backgroundColor: `${champagne}08`, borderColor: `${champagne}20`, color: `${slate}90` }}>
                <Shield className="h-3 w-3 inline mr-1" style={{ color: champagne }} />
                Financial details and client information are private and not shown publicly.
              </div>
              <Button
                onClick={() => { setSelectedProject(null); setShowEnquiry(true); }}
                className="w-full border-0 font-semibold"
                style={{ backgroundColor: navy, color: champagneLight }}
              >
                Enquire About a Similar Project
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enquiry Modal */}
      <Dialog open={showEnquiry} onOpenChange={setShowEnquiry}>
        <DialogContent className="max-w-md border-0 shadow-2xl" style={{ backgroundColor: ivory }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', Georgia, serif", color: navy }}>
              Start a Project
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnquirySubmit} className="space-y-3">
            <Input placeholder="Full Name" value={enquiryData.name} onChange={e => setEnquiryData(p => ({ ...p, name: e.target.value }))} required className="border-gray-200 focus-visible:ring-1" style={{ borderColor: `${navy}15` }} />
            <Input type="email" placeholder="Email" value={enquiryData.email} onChange={e => setEnquiryData(p => ({ ...p, email: e.target.value }))} required className="border-gray-200 focus-visible:ring-1" style={{ borderColor: `${navy}15` }} />
            <Input placeholder="Your Location" value={enquiryData.location} onChange={e => setEnquiryData(p => ({ ...p, location: e.target.value }))} required className="border-gray-200 focus-visible:ring-1" style={{ borderColor: `${navy}15` }} />
            <Select value={enquiryData.projectType} onValueChange={v => setEnquiryData(p => ({ ...p, projectType: v }))}>
              <SelectTrigger style={{ borderColor: `${navy}15` }}><SelectValue placeholder="Project Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1bed">1-Bedroom</SelectItem>
                <SelectItem value="2bed">2-Bedroom</SelectItem>
                <SelectItem value="3bed">3-Bedroom</SelectItem>
                <SelectItem value="4plus">4+ Bedroom / Custom</SelectItem>
                <SelectItem value="commercial">Commercial / Office</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Proposed Build Location" value={enquiryData.buildLocation} onChange={e => setEnquiryData(p => ({ ...p, buildLocation: e.target.value }))} className="border-gray-200 focus-visible:ring-1" style={{ borderColor: `${navy}15` }} />
            <Select value={enquiryData.budgetRange} onValueChange={v => setEnquiryData(p => ({ ...p, budgetRange: v }))}>
              <SelectTrigger style={{ borderColor: `${navy}15` }}><SelectValue placeholder="Budget Range (GHS)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="under-200k">Under GH₵200,000</SelectItem>
                <SelectItem value="200k-500k">GH₵200,000 – GH₵500,000</SelectItem>
                <SelectItem value="500k-1m">GH₵500,000 – GH₵1,000,000</SelectItem>
                <SelectItem value="over-1m">Over GH₵1,000,000</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full border-0 font-semibold" style={{ backgroundColor: navy, color: champagneLight }}>
              Submit Enquiry
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Projects;
