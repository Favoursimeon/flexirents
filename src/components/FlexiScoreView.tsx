import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lock, CheckCircle2, ShieldCheck, Briefcase, Wallet, CreditCard, TrendingUp, Clock, AlertCircle, Save, Users, HandCoins, Upload, FileText } from "lucide-react";
import { TIER_PLANS, calculateFIGScore, type FIGInput } from "@/lib/figScoring";
import { FlexiScoreImprovementTips } from "@/components/FlexiScoreImprovementTips";
import { FlexiScoreHistoryChart } from "@/components/FlexiScoreHistoryChart";
import { toast } from "sonner";

const FileUploadField = ({ label, description, onUpload, uploading, uploadedUrl }: {
  label: string;
  description: string;
  onUpload: (file: File) => void;
  uploading: boolean;
  uploadedUrl?: string | null;
}) => (
  <div className="space-y-2">
    <Label className="text-sm">{label}</Label>
    <p className="text-xs text-muted-foreground">{description}</p>
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-accent transition-colors">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        <span>{uploading ? "Uploading..." : "Upload PDF / Image"}</span>
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
          disabled={uploading}
        />
      </label>
      {uploadedUrl && (
        <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
          <FileText className="h-3 w-3" /> View
        </a>
      )}
    </div>
  </div>
);

interface Assessment {
  total_score: number | null;
  tier: string | null;
  income_score: number | null;
  affordability_score: number | null;
  employment_score: number | null;
  behaviour_score: number | null;
  verification_score: number | null;
  is_overridden: boolean | null;
  override_tier: string | null;
  monthly_net_income: number | null;
  target_rent: number | null;
  income_source: string | null;
  employer_tier: string | null;
  employment_duration_months: number | null;
  payment_behaviour: string | null;
  gov_id_verified: boolean | null;
  bank_verified: boolean | null;
  employment_verified: boolean | null;
  score_frozen: boolean | null;
  income_category: string | null;
  previous_flexirent_repayment: boolean | null;
  guarantor_credibility: string | null;
  mobile_money_consistency: boolean | null;
  rent_dispute_history: boolean | null;
  social_support_type: string | null;
  rent_burden_score: number | null;
  social_support_score: number | null;
  guarantor_evidence_url: string | null;
  bank_statement_url: string | null;
  social_support_evidence_url: string | null;
}

interface ScoreHistoryRecord {
  total_score: number;
  tier: string;
  recorded_at: string;
}

const tierConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  A: { label: "Tier A – Low Risk", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  B: { label: "Tier B – Medium", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  C: { label: "Tier C – Managed Risk", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  D: { label: "Tier D – Decline", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

const scoreBreakdown = [
  { key: "income_stability_score", label: "A. Income Stability", max: 40, icon: Wallet },
  { key: "payment_behaviour_score", label: "B. Payment History & Behaviour", max: 25, icon: CreditCard, needsApproval: true },
  { key: "rent_burden_score", label: "C. Rent Burden Ratio", max: 20, icon: TrendingUp },
  { key: "social_support_score", label: "D. Social & Structural Support", max: 15, icon: Users, needsApproval: true },
];

export default function FlexiScoreView() {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryRecord[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<string>("not_verified");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User-editable form fields
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [targetRent, setTargetRent] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("irregular");
  const [employmentDuration, setEmploymentDuration] = useState("");

  // B. Payment History user-editable fields
  const [guarantorCredibility, setGuarantorCredibility] = useState("none");
  const [rentDisputeHistory, setRentDisputeHistory] = useState("no");

  // D. Social Support user-editable field
  const [socialSupportType, setSocialSupportType] = useState("none");

  // File upload states
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});

  const handleFileUpload = async (file: File, fieldName: string) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }
    setUploadingField(fieldName);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fieldName", fieldName);
      formData.append("userId", user.id);

      const response = await api.post("/api/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadedFiles(prev => ({ ...prev, [fieldName]: response.data.publicUrl }));
      toast.success(`${fieldName.replace(/_/g, ' ')} uploaded successfully`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploadingField(null);
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchAssessment(), fetchVerificationStatus(), fetchScoreHistory()]);
    }
  }, [user]);

  const fetchAssessment = async () => {
    if (!user) return;
    try {
      const response = await api.get("/api/financial-assessments/me", {
        params: { userId: user.id },
      });
      const data = response.data;
      if (data) {
        setAssessment(data as any);
        setMonthlyIncome(data.monthly_net_income?.toString() || "");
        setTargetRent(data.target_rent?.toString() || "");
        setIncomeCategory(data.income_category || "irregular");
        setEmploymentDuration(data.employment_duration_months?.toString() || "");
        setGuarantorCredibility(data.guarantor_credibility || "none");
        setRentDisputeHistory(data.rent_dispute_history ? "yes" : "no");
        setSocialSupportType(data.social_support_type || "none");
        setUploadedFiles(prev => ({
          ...prev,
          ...(data.guarantor_evidence_url ? { guarantor_evidence: data.guarantor_evidence_url } : {}),
          ...(data.bank_statement_url ? { bank_statement: data.bank_statement_url } : {}),
          ...(data.social_support_evidence_url ? { social_support_evidence: data.social_support_evidence_url } : {}),
        }));
      }
    } catch (error) {
      console.error("Error fetching assessment:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationStatus = async () => {
    if (!user) return;
    try {
      const response = await api.get("/api/user-verification/me", {
        params: { userId: user.id },
      });
      if (response.data?.status) setVerificationStatus(response.data.status);
    } catch (error) {
      console.error("Error fetching verification:", error);
    }
  };

  const fetchScoreHistory = async () => {
    if (!user) return;
    try {
      const response = await api.get("/api/flexi-score-history", {
        params: { userId: user.id, limit: 50, orderBy: "recorded_at", orderDirection: "asc" },
      });
      setScoreHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching score history:", error);
    }
  };

  const liveScore = useMemo(() => {
    const input: FIGInput = {
      income_category: incomeCategory,
      employment_duration_months: parseInt(employmentDuration) || 0,
      previous_flexirent_repayment: assessment?.previous_flexirent_repayment || false,
      guarantor_credibility: guarantorCredibility,
      mobile_money_consistency: assessment?.mobile_money_consistency || false,
      rent_dispute_history: rentDisputeHistory === "yes",
      monthly_net_income: parseFloat(monthlyIncome) || 0,
      target_rent: parseFloat(targetRent) || 0,
      social_support_type: socialSupportType,
      income_source: assessment?.income_source || "salary",
      employer_tier: assessment?.employer_tier || "informal",
      payment_behaviour: assessment?.payment_behaviour || "frequent_issues",
      gov_id_verified: assessment?.gov_id_verified || verificationStatus === "verified",
      bank_verified: assessment?.bank_verified || false,
      employment_verified: assessment?.employment_verified || false,
    };
    return calculateFIGScore(input);
  }, [monthlyIncome, targetRent, incomeCategory, employmentDuration, guarantorCredibility, rentDisputeHistory, socialSupportType, assessment, verificationStatus]);

  const handleSave = async () => {
    if (!user) return;
    const income = parseFloat(monthlyIncome);
    const rent = parseFloat(targetRent);
    const duration = parseInt(employmentDuration);

    if (!income || income <= 0) { toast.error("Please enter a valid monthly income"); return; }
    if (!rent || rent <= 0) { toast.error("Please enter a valid target rent"); return; }

    setSaving(true);
    try {
      const baseData = {
        user_id: user.id,
        monthly_net_income: income,
        target_rent: rent,
        income_category: incomeCategory,
        employment_duration_months: duration || 0,
        guarantor_credibility: guarantorCredibility,
        rent_dispute_history: rentDisputeHistory === "yes",
        social_support_type: socialSupportType,
        income_score: liveScore.income_stability_score,
        affordability_score: liveScore.rent_burden_score,
        rent_burden_score: liveScore.rent_burden_score,
        social_support_score: liveScore.social_support_score,
        behaviour_score: liveScore.payment_behaviour_score,
        total_score: liveScore.total_score,
        tier: liveScore.tier,
        gov_id_verified: verificationStatus === "verified",
        verification_score: liveScore.verification_score,
        guarantor_evidence_url: uploadedFiles.guarantor_evidence || null,
        bank_statement_url: uploadedFiles.bank_statement || null,
        social_support_evidence_url: uploadedFiles.social_support_evidence || null,
        employment_score: liveScore.employment_score,
        previous_flexirent_repayment: false,
        mobile_money_consistency: false,
      };

      if (assessment && (assessment as any).id) {
        await api.put(`/api/financial-assessments/${(assessment as any).id}`, baseData);
      } else {
        await api.post("/api/financial-assessments", baseData);
      }

      await api.post("/api/flexi-score-history", {
        user_id: user.id,
        total_score: liveScore.total_score,
        income_stability_score: liveScore.income_stability_score,
        payment_behaviour_score: liveScore.payment_behaviour_score,
        rent_burden_score: liveScore.rent_burden_score,
        social_support_score: liveScore.social_support_score,
        tier: liveScore.tier,
      });

      toast.success("Financial data saved and score updated");
      await Promise.all([fetchAssessment(), fetchScoreHistory()]);
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast.error("Failed to save financial data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const effectiveTier = assessment?.is_overridden && assessment?.override_tier
    ? assessment.override_tier
    : liveScore.tier;
  const totalScore = liveScore.total_score;
  const tierInfo = tierConfig[effectiveTier] || tierConfig.D;
  const plans = TIER_PLANS[effectiveTier] || TIER_PLANS.D;
  const isFrozen = assessment?.score_frozen === true;

  const rentRatio = (parseFloat(monthlyIncome) || 0) > 0
    ? Math.round((parseFloat(targetRent) / parseFloat(monthlyIncome)) * 100)
    : null;

  // Pending approval flags
  const isPendingBehaviour = !assessment?.previous_flexirent_repayment && !assessment?.mobile_money_consistency;
  const isPendingSocialSupport = !assessment?.social_support_type || assessment.social_support_type === "none";

  return (
    <div className="space-y-6">
      {/* Overall Score Gauge - TOP */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Flexi Score</CardTitle>
              <CardDescription>FlexiRents Risk Scoring — Can you pay? How much flexibility?</CardDescription>
            </div>
            <div className={`px-3 py-1.5 rounded-full border font-semibold text-sm ${tierInfo.bg} ${tierInfo.border} ${tierInfo.color}`}>
              {tierInfo.label}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={totalScore >= 75 ? "hsl(142, 76%, 36%)" : totalScore >= 60 ? "hsl(217, 91%, 60%)" : totalScore >= 45 ? "hsl(45, 93%, 47%)" : "hsl(0, 84%, 60%)"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(totalScore / 100) * 327} 327`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-foreground">{totalScore}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Overall Flexi Score</p>
          </div>

          {/* 4-Dimension Breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Score Breakdown (4 Dimensions)</h4>
            {scoreBreakdown.map(({ key, label, max, icon: Icon, needsApproval }) => {
              const value = (liveScore as any)[key] || 0;
              const pct = max > 0 ? (value / max) * 100 : 0;
              const isPending = needsApproval && (
                (key === "payment_behaviour_score" && isPendingBehaviour) ||
                (key === "social_support_score" && isPendingSocialSupport)
              );

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground flex items-center gap-2">
                          {label}
                          {isPending && (
                            <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 text-[10px] px-1.5 py-0 gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              Pending
                            </Badge>
                          )}
                        </span>
                        <span className="text-muted-foreground">{value}/{max}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Score History Chart */}
      <FlexiScoreHistoryChart history={scoreHistory} />

      {/* Data Entry Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
          <CardDescription>
            Enter your details. Sections B & D require admin verification for full scoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isFrozen && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
              <Lock className="h-4 w-4 flex-shrink-0" />
              <span>Your score is currently frozen by an administrator.</span>
            </div>
          )}

          {/* A. Income Stability (40 pts) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Wallet className="h-4 w-4" /> A. Income Stability (40 pts)
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Income Category</Label>
                <Select value={incomeCategory} onValueChange={setIncomeCategory} disabled={isFrozen}>
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
              <div className="space-y-2">
                <Label>Monthly Net Income (GHS)</Label>
                <Input type="number" min="0" step="0.01" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="e.g. 3000" disabled={isFrozen} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-sm">
              <span className="font-medium">Score: </span>
              <span className="text-primary font-bold">{liveScore.income_stability_score}/40</span>
              <span className="text-muted-foreground ml-2">— Defaults correlate more with income volatility than income size.</span>
            </div>
          </div>

          {/* B. Payment History & Behaviour (25 pts) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> B. Payment History & Behaviour (25 pts)
            </h4>

            {/* Previous FlexiRent Repayment - Admin verified */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div>
                <p className="text-sm font-medium">Previous FlexiRent Repayment</p>
                <p className="text-xs text-muted-foreground">+15 points if verified by admin</p>
              </div>
              {assessment?.previous_flexirent_repayment ? (
                <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700 text-xs gap-1"><CheckCircle2 className="h-3 w-3" /> +15</Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 text-xs gap-1"><Clock className="h-3 w-3" /> Admin Pending</Badge>
              )}
            </div>

            {/* Guarantor Credibility - User selectable + file upload */}
            <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Guarantor Credibility</Label>
                  <Select value={guarantorCredibility} onValueChange={setGuarantorCredibility} disabled={isFrozen}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strong">Strong Guarantor (+10 pts)</SelectItem>
                      <SelectItem value="none">None (0 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FileUploadField
                  label="Guarantor Evidence"
                  description="Upload guarantor letter or agreement (PDF/Image)"
                  onUpload={(f) => handleFileUpload(f, "guarantor_evidence")}
                  uploading={uploadingField === "guarantor_evidence"}
                  uploadedUrl={uploadedFiles.guarantor_evidence}
                />
              </div>
            </div>

            {/* Mobile Money / Bank Consistency - Admin verified + file upload */}
            <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Mobile Money / Bank Consistency</p>
                  <p className="text-xs text-muted-foreground">+10 points if verified by admin</p>
                </div>
                {assessment?.mobile_money_consistency ? (
                  <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700 text-xs gap-1"><CheckCircle2 className="h-3 w-3" /> +10</Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 text-xs gap-1"><Clock className="h-3 w-3" /> Admin Pending</Badge>
                )}
              </div>
              <FileUploadField
                label="Bank/MoMo Statement"
                description="Upload bank or mobile money statement showing 12+ months consistency (PDF/Image)"
                onUpload={(f) => handleFileUpload(f, "bank_statement")}
                uploading={uploadingField === "bank_statement"}
                uploadedUrl={uploadedFiles.bank_statement}
              />
            </div>

            {/* Rent Dispute History - User selectable */}
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <Label>History of Rent Disputes</Label>
              <Select value={rentDisputeHistory} onValueChange={setRentDisputeHistory} disabled={isFrozen}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No Disputes (0 pts deduction)</SelectItem>
                  <SelectItem value="yes">Has Dispute History (−10 pts)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 text-sm">
              <span className="font-medium">Score: </span>
              <span className="text-primary font-bold">{liveScore.payment_behaviour_score}/25</span>
              <span className="text-muted-foreground ml-2">— Behaviour beats promises.</span>
            </div>
          </div>

          {/* C. Rent Burden Ratio (20 pts) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> C. Rent Burden Ratio (20 pts)
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Target Monthly Rent (GHS)</Label>
                <Input type="number" min="0" step="0.01" value={targetRent} onChange={(e) => setTargetRent(e.target.value)} placeholder="e.g. 800" disabled={isFrozen} />
              </div>
              <div className="space-y-2">
                <Label>Employment Duration (months)</Label>
                <Input type="number" min="0" value={employmentDuration} onChange={(e) => setEmploymentDuration(e.target.value)} placeholder="e.g. 24" disabled={isFrozen} />
              </div>
            </div>
            {rentRatio !== null && (
              <div className={`p-3 rounded-lg text-sm border ${rentRatio <= 30 ? "bg-green-50 border-green-200" : rentRatio <= 40 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
                <span className="font-medium">Rent is {rentRatio}% of income</span>
                {rentRatio <= 30 && <span className="text-green-700 ml-2">→ 20 pts (Comfortable)</span>}
                {rentRatio > 30 && rentRatio <= 35 && <span className="text-yellow-700 ml-2">→ 17 pts</span>}
                {rentRatio > 35 && rentRatio <= 40 && <span className="text-yellow-700 ml-2">→ 13 pts</span>}
                {rentRatio > 40 && <span className="text-red-700 ml-2">→ 7 pts (Usually reject)</span>}
              </div>
            )}
            <div className="p-3 rounded-lg bg-muted/30 text-sm">
              <span className="font-medium">Score: </span>
              <span className="text-primary font-bold">{liveScore.rent_burden_score}/20</span>
              <span className="text-muted-foreground ml-2">— Prevents silent stress that leads to default.</span>
            </div>
          </div>

          {/* D. Social & Structural Support (15 pts) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Users className="h-4 w-4" /> D. Social & Structural Support (15 pts)
            </h4>

            <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Support Type</Label>
                  <Select value={socialSupportType} onValueChange={setSocialSupportType} disabled={isFrozen}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employer_backed">Employer-Backed Deduction (15 pts)</SelectItem>
                      <SelectItem value="strong_guarantor">Strong Guarantor (12 pts)</SelectItem>
                      <SelectItem value="family_fallback">Family Fallback (6 pts)</SelectItem>
                      <SelectItem value="none">None (0 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FileUploadField
                  label="Support Evidence"
                  description="Upload employer letter, guarantor form, or family support document (PDF/Image)"
                  onUpload={(f) => handleFileUpload(f, "social_support_evidence")}
                  uploading={uploadingField === "social_support_evidence"}
                  uploadedUrl={uploadedFiles.social_support_evidence}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 text-sm">
              <span className="font-medium">Score: </span>
              <span className="text-primary font-bold">{liveScore.social_support_score}/15</span>
              <span className="text-muted-foreground ml-2">— Improves recovery, not approval.</span>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || isFrozen} className="w-full">
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save & Update Score</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Improvement Tips */}
      <FlexiScoreImprovementTips
        incomeScore={liveScore.income_stability_score}
        affordabilityScore={liveScore.rent_burden_score}
        behaviourScore={liveScore.payment_behaviour_score}
        socialSupportScore={liveScore.social_support_score}
        totalScore={totalScore}
        tier={effectiveTier}
        isPendingBehaviour={isPendingBehaviour}
        monthlyIncome={parseFloat(monthlyIncome) || 0}
        targetRent={parseFloat(targetRent) || 0}
        employmentDurationMonths={parseInt(employmentDuration) || 0}
      />

      {/* Eligible Payment Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eligible Payment Plans</CardTitle>
          <CardDescription>Based on your tier. Decline ≠ rejection forever — it means not now, not this product.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.allowed.map((plan) => (
              <div key={plan} className="flex items-center gap-3 p-3 rounded-lg border bg-green-50/50 border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="font-medium text-foreground">{plan}</span>
              </div>
            ))}
            {plans.locked.map((plan) => (
              <div key={plan} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 border-muted opacity-60">
                <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-muted-foreground line-through">{plan}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
