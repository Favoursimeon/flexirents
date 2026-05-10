
-- ==========================================
-- CONSTRUCTION PROJECTS MODULE - FULL SCHEMA
-- ==========================================

-- 1. construction_projects
CREATE TABLE public.construction_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '3bed',
  location TEXT NOT NULL,
  neighbourhood TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  current_phase INTEGER NOT NULL DEFAULT 1,
  total_phases INTEGER NOT NULL DEFAULT 8,
  current_phase_name TEXT NOT NULL DEFAULT 'Land acquisition',
  overall_percent INTEGER NOT NULL DEFAULT 0,
  current_phase_percent INTEGER NOT NULL DEFAULT 0,
  budget_ghs NUMERIC NOT NULL DEFAULT 0,
  spent_ghs NUMERIC NOT NULL DEFAULT 0,
  client_id UUID,
  estimated_completion TEXT,
  start_date TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  public_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.construction_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public projects" ON public.construction_projects
  FOR SELECT USING (is_public = true);

CREATE POLICY "Clients can view own projects" ON public.construction_projects
  FOR SELECT TO authenticated USING (auth.uid() = client_id);

CREATE POLICY "Admins full access on projects" ON public.construction_projects
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. project_phases
CREATE TABLE public.project_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.construction_projects(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  percent_complete INTEGER NOT NULL DEFAULT 0,
  start_date TEXT,
  completion_date TEXT,
  budget_ghs NUMERIC NOT NULL DEFAULT 0,
  payment_trigger TEXT,
  signed_off_by TEXT,
  sign_off_date TEXT,
  invoice_auto_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view phases of public projects" ON public.project_phases
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.construction_projects
    WHERE construction_projects.id = project_phases.project_id AND construction_projects.is_public = true
  ));

CREATE POLICY "Clients can view own project phases" ON public.project_phases
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.construction_projects
    WHERE construction_projects.id = project_phases.project_id AND construction_projects.client_id = auth.uid()
  ));

CREATE POLICY "Admins full access on phases" ON public.project_phases
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. project_experts
CREATE TABLE public.project_experts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phase_group TEXT NOT NULL DEFAULT 'groundwork',
  unit_types TEXT[] NOT NULL DEFAULT '{}',
  required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_experts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view experts" ON public.project_experts
  FOR SELECT USING (true);

CREATE POLICY "Admins full access on experts" ON public.project_experts
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. phase_experts (junction)
CREATE TABLE public.phase_experts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.project_experts(id) ON DELETE CASCADE,
  assigned_by TEXT NOT NULL DEFAULT 'tbd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.phase_experts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view phase experts of public projects" ON public.phase_experts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.project_phases pp
    JOIN public.construction_projects cp ON cp.id = pp.project_id
    WHERE pp.id = phase_experts.phase_id AND cp.is_public = true
  ));

CREATE POLICY "Clients can view own phase experts" ON public.phase_experts
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.project_phases pp
    JOIN public.construction_projects cp ON cp.id = pp.project_id
    WHERE pp.id = phase_experts.phase_id AND cp.client_id = auth.uid()
  ));

CREATE POLICY "Admins full access on phase experts" ON public.phase_experts
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. project_clients
CREATE TABLE public.project_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  location TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'Ghana',
  flag TEXT NOT NULL DEFAULT '🇬🇭',
  client_type TEXT NOT NULL DEFAULT 'local_construction',
  portal_active BOOLEAN NOT NULL DEFAULT true,
  satisfaction_rating NUMERIC,
  payment_status TEXT NOT NULL DEFAULT 'current',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own record" ON public.project_clients
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins full access on clients" ON public.project_clients
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. project_payments
CREATE TABLE public.project_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.construction_projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.project_clients(id),
  tranche_number INTEGER NOT NULL DEFAULT 1,
  phase_name TEXT NOT NULL DEFAULT '',
  amount_ghs NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_date TEXT,
  paid_via TEXT,
  invoice_sent_date TEXT,
  receipt_sent_date TEXT,
  receipt_auto_generated BOOLEAN NOT NULL DEFAULT false,
  payment_trigger TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own payments" ON public.project_payments
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.construction_projects
    WHERE construction_projects.id = project_payments.project_id AND construction_projects.client_id = auth.uid()
  ));

CREATE POLICY "Admins full access on payments" ON public.project_payments
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. project_documents
CREATE TABLE public.project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.construction_projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.project_clients(id),
  type TEXT NOT NULL DEFAULT 'certificate',
  name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  auto_generated BOOLEAN NOT NULL DEFAULT false,
  size_kb INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own documents" ON public.project_documents
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.construction_projects
    WHERE construction_projects.id = project_documents.project_id AND construction_projects.client_id = auth.uid()
  ));

CREATE POLICY "Admins full access on project documents" ON public.project_documents
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. project_site_updates
CREATE TABLE public.project_site_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.construction_projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'photos',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  author TEXT NOT NULL DEFAULT '',
  auto_generated BOOLEAN NOT NULL DEFAULT false,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_site_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own project updates" ON public.project_site_updates
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.construction_projects
    WHERE construction_projects.id = project_site_updates.project_id AND construction_projects.client_id = auth.uid()
  ));

CREATE POLICY "Admins full access on site updates" ON public.project_site_updates
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. project_risks (admin only)
CREATE TABLE public.project_risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.construction_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'medium',
  mitigation TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  auto_alert_enabled BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on risks" ON public.project_risks
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. project_automation_rules (admin only)
CREATE TABLE public.project_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  fire_count INTEGER NOT NULL DEFAULT 0,
  last_fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on automation rules" ON public.project_automation_rules
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 11. project_automation_events (admin only)
CREATE TABLE public.project_automation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.project_automation_rules(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.construction_projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.project_clients(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_automation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on automation events" ON public.project_automation_events
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 12. project_submissions (client submissions)
CREATE TABLE public.project_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  unit_type TEXT NOT NULL DEFAULT '3bed',
  land_ownership TEXT NOT NULL DEFAULT 'owned',
  budget_range TEXT,
  completion_target TEXT,
  design_style TEXT,
  finishes_level TEXT NOT NULL DEFAULT 'standard',
  special_requirements TEXT,
  expert_selections JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_review',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can insert own submissions" ON public.project_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clients can view own submissions" ON public.project_submissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins full access on submissions" ON public.project_submissions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_site_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_automation_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_documents;

-- Updated_at triggers
CREATE TRIGGER update_construction_projects_updated_at BEFORE UPDATE ON public.construction_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_phases_updated_at BEFORE UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_clients_updated_at BEFORE UPDATE ON public.project_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_payments_updated_at BEFORE UPDATE ON public.project_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_risks_updated_at BEFORE UPDATE ON public.project_risks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_automation_rules_updated_at BEFORE UPDATE ON public.project_automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_submissions_updated_at BEFORE UPDATE ON public.project_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
