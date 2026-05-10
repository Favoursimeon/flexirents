import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Wallet,
  TrendingUp,
  CreditCard,
  Users,
  Target,
  ArrowUp,
} from "lucide-react";

interface FlexiScoreImprovementTipsProps {
  incomeScore: number;
  affordabilityScore: number;
  behaviourScore: number;
  socialSupportScore: number;
  totalScore: number;
  tier: string;
  monthlyIncome: number;
  targetRent: number;
  employmentDurationMonths: number;
  isPendingBehaviour: boolean;
}

interface Tip {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  potentialPoints: number;
}

export const FlexiScoreImprovementTips = ({
  incomeScore,
  affordabilityScore,
  behaviourScore,
  socialSupportScore,
  totalScore,
  tier,
  monthlyIncome,
  targetRent,
  employmentDurationMonths,
  isPendingBehaviour,
}: FlexiScoreImprovementTipsProps) => {
  const tips = useMemo((): Tip[] => {
    const generated: Tip[] = [];

    // A. Income Stability (max 40)
    if (incomeScore < 40) {
      const gap = 40 - incomeScore;
      generated.push({
        id: "income",
        icon: Wallet,
        title: "Boost Income Stability",
        description: incomeScore <= 14
          ? "You're scored as irregular income. Documenting 12+ months of consistent income or moving to salaried employment can significantly increase this score."
          : incomeScore <= 29
          ? "Consider formalizing your income sources. A permanent salaried role earns the maximum 40 points."
          : "You're close to the top! A permanent salaried position would max this out at 40 points.",
        impact: gap > 15 ? "high" : gap > 8 ? "medium" : "low",
        potentialPoints: gap,
      });
    }

    // B. Payment History (max 25)
    if (behaviourScore < 25) {
      const gap = 25 - behaviourScore;
      generated.push({
        id: "behaviour",
        icon: CreditCard,
        title: "Improve Payment History",
        description: isPendingBehaviour
          ? "Submit your bank/mobile money statements and build a clean FlexiRent repayment record. A strong guarantor can add +10 points."
          : "Continue building your payment track record. Each verified positive signal increases your score.",
        impact: gap > 12 ? "high" : "medium",
        potentialPoints: gap,
      });
    }

    // C. Rent Burden (max 20)
    if (affordabilityScore < 20 && monthlyIncome > 0 && targetRent > 0) {
      const rentRatio = targetRent / monthlyIncome;
      generated.push({
        id: "affordability",
        icon: TrendingUp,
        title: "Reduce Rent Burden",
        description: `Your rent is ${Math.round(rentRatio * 100)}% of income. Keeping rent ≤30% earns the maximum 20 points. ${rentRatio > 0.4 ? "Consider properties with lower rent to avoid rejection." : "A small income increase or rent reduction could boost this score."}`,
        impact: affordabilityScore <= 7 ? "high" : "medium",
        potentialPoints: 20 - affordabilityScore,
      });
    }

    // D. Social Support (max 15)
    if (socialSupportScore < 15) {
      const gap = 15 - socialSupportScore;
      generated.push({
        id: "social",
        icon: Users,
        title: "Add Social Support",
        description: socialSupportScore === 0
          ? "Having an employer-backed salary deduction (15 pts), strong guarantor (12 pts), or family fallback (6 pts) significantly reduces risk and boosts your score."
          : "Upgrading to employer-backed deduction could maximize this dimension at 15 points.",
        impact: gap > 10 ? "high" : "medium",
        potentialPoints: gap,
      });
    }

    // Tier progression
    if (tier === "D" && totalScore < 45) {
      generated.push({
        id: "tier-up",
        icon: Target,
        title: `${45 - totalScore} pts to Tier C`,
        description: "Reaching Tier C unlocks the Flexi75 payment plan. Focus on the highest-impact areas above.",
        impact: "high",
        potentialPoints: 45 - totalScore,
      });
    } else if (tier === "C" && totalScore < 60) {
      generated.push({
        id: "tier-up",
        icon: Target,
        title: `${60 - totalScore} pts to Tier B`,
        description: "Tier B unlocks Flexi50 — moderate flexibility with caps.",
        impact: "medium",
        potentialPoints: 60 - totalScore,
      });
    } else if (tier === "B" && totalScore < 75) {
      generated.push({
        id: "tier-up",
        icon: Target,
        title: `${75 - totalScore} pts to Tier A`,
        description: "Tier A unlocks FlexiMonthly — the best terms and longest flexibility.",
        impact: "medium",
        potentialPoints: 75 - totalScore,
      });
    }

    return generated.sort((a, b) => b.potentialPoints - a.potentialPoints).slice(0, 4);
  }, [incomeScore, affordabilityScore, behaviourScore, socialSupportScore, totalScore, tier, isPendingBehaviour, monthlyIncome, targetRent, employmentDurationMonths]);

  const getImpactBadge = (impact: Tip["impact"]) => {
    switch (impact) {
      case "high":
        return <Badge variant="destructive" className="text-xs">High Impact</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">Medium Impact</Badge>;
      case "low":
        return <Badge variant="outline" className="text-xs">Low Impact</Badge>;
    }
  };

  if (tips.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">How to Improve Your Score</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {tips.length} Tip{tips.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <CardDescription>
          {tier === "A"
            ? "Great job! Maintain your score to keep Tier A benefits."
            : "Focus on these areas to unlock better payment plans."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
            >
              <div className="flex-shrink-0">
                <div
                  className={`p-2 rounded-full ${
                    tip.impact === "high"
                      ? "bg-red-500/10"
                      : tip.impact === "medium"
                      ? "bg-yellow-500/10"
                      : "bg-green-500/10"
                  }`}
                >
                  <tip.icon
                    className={`h-5 w-5 ${
                      tip.impact === "high"
                        ? "text-red-500"
                        : tip.impact === "medium"
                        ? "text-yellow-500"
                        : "text-green-500"
                    }`}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-medium text-sm">{tip.title}</h4>
                  {getImpactBadge(tip.impact)}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" />
                    +{tip.potentialPoints} pts
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
