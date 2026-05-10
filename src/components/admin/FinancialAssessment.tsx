import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Lock, CheckCircle, AlertTriangle, Save, FileText, ExternalLink, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import api from "@/lib/api";
import { calculateFIGScore, TIER_PLANS, type FIGInput } from "@/lib/figScoring";
import { useAuth } from "@/contexts/AuthContext";

interface Assessment {
  id: string;
  user_id: string;
  monthly_net_income: number;
  income_source: string;
  employer_tier: string;
  employment_duration_months: number;
  target_rent: number;
  payment_behaviour: string;
  has_prior_flexirent_history: boolean;
  gov_id_verified: boolean;
  bank_verified: boolean;
  employment_verified: boolean;
  income_score: number;
  affordability_score: number;
  employment_score: number;
  behaviour_score: number;
  verification_score: number;
  total_score: number;
  tier: string;
  is_overridden: boolean;
  override_tier: string | null;
  override_reason: string | null;
  score_frozen: boolean;
  income_category: string;
  previous_flexirent_repayment: boolean;
  guarantor_credibility: string;
  mobile_money_consistency: boolean;
  rent_dispute_history: boolean;
  social_support_type: string;
  rent_burden_score: number;
  social_support_score: number;
  guarantor_evidence_url: string | null;
  bank_statement_url: string | null;
  social_support_evidence_url: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null } | null;
}

function buildFIGInput(form: Partial<Assessment>): FIGInput {
  return {
    income_category: form.income_category || "irregular",
    employment_duration_months: Number(form.employment_duration_months) || 0,
    previous_flexirent_repayment: form.previous_flexirent_repayment || false,
    guarantor_credibility: form.guarantor_credibility || "none",
    mobile_money_consistency: form.mobile_money_consistency || false,
    rent_dispute_history: form.rent_dispute_history || false,
    monthly_net_income: Number(form.monthly_net_income) || 0,
    target_rent: Number(form.target_rent) || 0,
    social_support_type: form.social_support_type || "none",
    income_source: form.income_source || "salary",
    employer_tier: form.employer_tier || "sme",
    payment_behaviour: form.payment_behaviour || "clean",
    gov_id_verified: form.gov_id_verified || false,
    bank_verified: form.bank_verified || false,
    employment_verified: form.employment_verified || false,
  };
}

export default function FinancialAssessment() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Assessment | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Assessment>>({});
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideTier, setOverrideTier] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => { fetchAssessments(); }, []);

  const fetchAssessments = async () => {
    try {
      const { data } = await api.get("/api/admin/financial-assessments");
      const assessmentsData = data?.assessments || [];
      setAssessments(assessmentsData);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      toast({ title: "Error", description: "Failed to load assessments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const scores = calculateFIGScore(buildFIGInput(editForm));

      await api.put(`/api/admin/financial-assessments/${selected.id}`, {
        monthly_net_income: Number(editForm.monthly_net_income) || 0,
        target_rent: Number(editForm.target_rent) || 0,
        income_source: editForm.income_source,
        employer_tier: editForm.employer_tier,
        employment_duration_months: Number(editForm.employment_duration_months) || 0,
        payment_behaviour: editForm.payment_behaviour,
        gov_id_verified: editForm.gov_id_verified,
        bank_verified: editForm.bank_verified,
        employment_verified: editForm.employment_verified,
        income_category: editForm.income_category,
        previous_flexirent_repayment: editForm.previous_flexirent_repayment,
        guarantor_credibility: editForm.guarantor_credibility,
        mobile_money_consistency: editForm.mobile_money_consistency,
        rent_dispute_history: editForm.rent_dispute_history,
        social_support_type: editForm.social_support_type,
        income_score: scores.income_stability_score,
        affordability_score: scores.rent_burden_score,
        employment_score: scores.employment_score,
        behaviour_score: scores.payment_behaviour_score,
        verification_score: scores.verification_score,
        rent_burden_score: scores.rent_burden_score,
        social_support_score: scores.social_support_score,
        total_score: scores.total_score,
        tier: scores.tier,
        updated_at: new Date().toISOString(),
      });
      toast({ title: "Success", description: "Assessment updated & score recalculated" });
      setEditing(false);
      setSelected(null);
      fetchAssessments();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save assessment", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleOverride = async () => {
    if (!selected || !overrideTier || !overrideReason.trim()) {
      toast({ title: "Error", description: "Select a tier and provide a reason", variant: "destructive" });
      return;
    }
    setProcessing(true);
    try {
      await api.put(`/api/admin/financial-assessments/${selected.id}/override`, {
        is_overridden: true,
        override_tier: overrideTier,
        override_reason: overrideReason,
        overridden_by: user?.id,
        overridden_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      toast({ title: "Success", description: `Tier overridden to ${overrideTier}` });
      setSelected(null);
      setOverrideReason("");
      setOverrideTier("");
      fetchAssessments();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Override failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const getTierBadge = (tier: string, overridden?: boolean) => {
    const colors: Record<string, string> = {
      A: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      B: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      D: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      <Badge className={`${colors[tier] || ""} ${overridden ? "ring-2 ring-orange-400" : ""}`}>
        Tier {tier} {overridden && "(Override)"}
      </Badge>
    );
  };

  const ScoreBar = ({ label, score, max }: { label: string; score: number; max: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/{max}</span>
      </div>
      <Progress value={(score / max) * 100} className="h-2" />
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Financial Assessment (FIG)</h2>
        <p className="text-muted-foreground mt-2">
          FlexiRents Risk Scoring — 4 dimensions, 100 points total
        </p>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No financial assessments found. Assessments are created when users complete verification.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assessments.map((a) => {
            const effectiveTier = a.is_overridden && a.override_tier ? a.override_tier : a.tier;
            const plans = TIER_PLANS[effectiveTier] || TIER_PLANS.D;
            return (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{a.profiles?.full_name || "Unknown User"}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Score: {a.total_score}/100 • Updated: {new Date(a.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.score_frozen && <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />Frozen</Badge>}
                      {getTierBadge(effectiveTier, a.is_overridden)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <ScoreBar label="Income Stability" score={Number(a.income_score) || 0} max={40} />
                    <ScoreBar label="Payment History" score={Number(a.behaviour_score) || 0} max={25} />
                    <ScoreBar label="Rent Burden" score={Number(a.rent_burden_score) || 0} max={20} />
                    <ScoreBar label="Social Support" score={Number(a.social_support_score) || 0} max={15} />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {plans.allowed.map((p) => (
                      <Badge key={p} variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />{p}
                      </Badge>
                    ))}
                    {plans.locked.map((p) => (
                      <Badge key={p} variant="secondary" className="opacity-60">
                        <Lock className="h-3 w-3 mr-1" />{p}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelected(a);
                      setEditForm(a);
                      setEditing(true);
                    }}>
                      Edit Assessment
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelected(a);
                      setOverrideTier(a.override_tier || "");
                      setOverrideReason(a.override_reason || "");
                    }}>
                      <Shield className="h-4 w-4 mr-1" />Override Tier
                    </Button>
                  </div>

                  {/* Evidence Documents Review */}
                  {(a.guarantor_evidence_url || a.bank_statement_url || a.social_support_evidence_url) && (
                    <div className="mt-4 p-4 rounded-lg border bg-muted/30 space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Uploaded Evidence Documents
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {a.guarantor_evidence_url && (
                          <a
                            href={a.guarantor_evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 rounded-lg border bg-background hover:bg-accent transition-colors text-sm"
                          >
                            <Eye className="h-4 w-4 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">Guarantor Evidence</p>
                              <p className="text-xs text-muted-foreground">Letter / Agreement</p>
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0" />
                          </a>
                        )}
                        {a.bank_statement_url && (
                          <a
                            href={a.bank_statement_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 rounded-lg border bg-background hover:bg-accent transition-colors text-sm"
                          >
                            <Eye className="h-4 w-4 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">Bank / MoMo Statement</p>
                              <p className="text-xs text-muted-foreground">12+ months consistency</p>
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0" />
                          </a>
                        )}
                        {a.social_support_evidence_url && (
                          <a
                            href={a.social_support_evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 rounded-lg border bg-background hover:bg-accent transition-colors text-sm"
                          >
                            <Eye className="h-4 w-4 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">Support Evidence</p>
                              <p className="text-xs text-muted-foreground">Employer / Guarantor / Family</p>
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Assessment Dialog */}
      <Dialog open={editing} onOpenChange={() => setEditing(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Financial Assessment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">A. Income Stability (40 pts)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Income Category</Label>
                <Select value={editForm.income_category || "irregular"} onValueChange={(v) => setEditForm({ ...editForm, income_category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salaried_permanent">Salaried – Permanent (40 pts)</SelectItem>
                    <SelectItem value="salaried_contract">Salaried – Contract (34 pts)</SelectItem>
                    <SelectItem value="mixed_income">Mixed Income (29 pts)</SelectItem>
                    <SelectItem value="informal_consistent">Informal but Consistent (24 pts)</SelectItem>
                    <SelectItem value="irregular">Irregular / Unverifiable (14 pts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monthly Net Income (GHS)</Label>
                <Input type="number" value={editForm.monthly_net_income || ""} onChange={(e) => setEditForm({ ...editForm, monthly_net_income: Number(e.target.value) })} />
              </div>
            </div>

            <h4 className="text-sm font-semibold text-muted-foreground uppercase mt-4">B. Payment History & Behaviour (25 pts)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={editForm.previous_flexirent_repayment || false} onCheckedChange={(v) => setEditForm({ ...editForm, previous_flexirent_repayment: v })} />
                <Label>Previous FlexiRent Repayment (+15)</Label>
              </div>
              <div>
                <Label>Guarantor Credibility</Label>
                <Select value={editForm.guarantor_credibility || "none"} onValueChange={(v) => setEditForm({ ...editForm, guarantor_credibility: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strong">Strong Guarantor (+10)</SelectItem>
                    <SelectItem value="none">None (0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editForm.mobile_money_consistency || false} onCheckedChange={(v) => setEditForm({ ...editForm, mobile_money_consistency: v })} />
                <Label>Mobile Money / Bank Consistency (+10)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editForm.rent_dispute_history || false} onCheckedChange={(v) => setEditForm({ ...editForm, rent_dispute_history: v })} />
                <Label className="text-destructive">Rent Dispute History (−10)</Label>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-muted-foreground uppercase mt-4">C. Rent Burden Ratio (20 pts)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Rent (GHS)</Label>
                <Input type="number" value={editForm.target_rent || ""} onChange={(e) => setEditForm({ ...editForm, target_rent: Number(e.target.value) })} />
              </div>
              <div className="text-sm text-muted-foreground pt-6">
                {editForm.monthly_net_income && editForm.target_rent
                  ? `Rent is ${Math.round((Number(editForm.target_rent) / Number(editForm.monthly_net_income)) * 100)}% of income`
                  : "Enter income and rent to see ratio"}
              </div>
            </div>

            <h4 className="text-sm font-semibold text-muted-foreground uppercase mt-4">D. Social & Structural Support (15 pts)</h4>
            <div>
              <Label>Support Type</Label>
              <Select value={editForm.social_support_type || "none"} onValueChange={(v) => setEditForm({ ...editForm, social_support_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employer_backed">Employer-Backed Deduction (15 pts)</SelectItem>
                  <SelectItem value="strong_guarantor">Strong Guarantor (12 pts)</SelectItem>
                  <SelectItem value="family_fallback">Family Fallback (6 pts)</SelectItem>
                  <SelectItem value="none">None (0 pts)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Live Preview */}
          {editForm.monthly_net_income && editForm.target_rent ? (
            <div className="mt-4 p-4 rounded-lg border bg-muted/50">
              <p className="text-sm font-medium mb-2">Live Score Preview</p>
              {(() => {
                const preview = calculateFIGScore(buildFIGInput(editForm));
                return (
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold">{preview.total_score}/100</span>
                    {getTierBadge(preview.tier)}
                  </div>
                );
              })()}
            </div>
          ) : null}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveAssessment} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save & Recalculate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Override Dialog */}
      <Dialog open={!!selected && !editing} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <AlertTriangle className="h-5 w-5 inline mr-2 text-orange-500" />
              Override Tier — {selected?.profiles?.full_name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Current calculated score: {selected?.total_score}/100 (Tier {selected?.tier}). Overrides are logged and auditable.
          </p>
          <div className="space-y-4 mt-4">
            <div>
              <Label>New Tier</Label>
              <Select value={overrideTier} onValueChange={setOverrideTier}>
                <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Tier A (75-100)</SelectItem>
                  <SelectItem value="B">Tier B (60-74)</SelectItem>
                  <SelectItem value="C">Tier C (45-59)</SelectItem>
                  <SelectItem value="D">Tier D (&lt;45)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason for Override</Label>
              <Textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Explain why this tier is being overridden..." rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleOverride} disabled={processing} variant="destructive">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Confirm Override
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
