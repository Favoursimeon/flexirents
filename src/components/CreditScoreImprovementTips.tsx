import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Calendar,
  Shield,
  Target,
  Zap
} from "lucide-react";

interface PaymentRecord {
  id: string;
  due_date: string;
  payment_date: string | null;
  status: string;
  amount: number;
}

interface CreditScoreImprovementTipsProps {
  score: number;
  rating: "Excellent" | "Good" | "Fair" | "Poor" | "No History";
  onTimePayments: number;
  latePayments: number;
  missedPayments: number;
  totalPayments: number;
  paymentHistory: PaymentRecord[];
}

interface Tip {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  priority: number;
}

export const CreditScoreImprovementTips = ({
  score,
  rating,
  onTimePayments,
  latePayments,
  missedPayments,
  totalPayments,
}: CreditScoreImprovementTipsProps) => {
  const tips = useMemo((): Tip[] => {
    const generatedTips: Tip[] = [];

    // No history tips
    if (rating === "No History" || totalPayments === 0) {
      generatedTips.push({
        id: "start-history",
        icon: Target,
        title: "Start Building Your Credit History",
        description: "Make your first rental payment to begin establishing your credit score. Consistent payments over time will help you build a strong credit profile.",
        impact: "high",
        priority: 1,
      });
      generatedTips.push({
        id: "set-reminders",
        icon: Calendar,
        title: "Set Up Payment Reminders",
        description: "Enable notifications for upcoming payment due dates to ensure you never miss a payment deadline.",
        impact: "medium",
        priority: 2,
      });
      return generatedTips;
    }

    // Tips for users with missed payments
    if (missedPayments > 0) {
      generatedTips.push({
        id: "clear-overdue",
        icon: AlertTriangle,
        title: "Clear Outstanding Payments",
        description: `You have ${missedPayments} severely overdue payment${missedPayments > 1 ? 's' : ''}. Clearing these will significantly improve your credit score and prevent further damage.`,
        impact: "high",
        priority: 1,
      });
    }

    // Tips for users with late payments
    if (latePayments > 0) {
      generatedTips.push({
        id: "avoid-late",
        icon: Clock,
        title: "Pay Before Due Dates",
        description: `You've had ${latePayments} late payment${latePayments > 1 ? 's' : ''}. Setting up automatic payments or calendar reminders can help you pay on time consistently.`,
        impact: "high",
        priority: 2,
      });
    }

    // Score-based tips
    if (score < 550) {
      generatedTips.push({
        id: "consistency-poor",
        icon: TrendingUp,
        title: "Focus on Consistent On-Time Payments",
        description: "Each on-time payment adds points to your score. Aim for 3-6 consecutive on-time payments to see significant improvement.",
        impact: "high",
        priority: 3,
      });
    } else if (score < 650) {
      generatedTips.push({
        id: "maintain-streak",
        icon: Zap,
        title: "Build Your Payment Streak",
        description: "You're making progress! Continue paying on time to build momentum. A streak of on-time payments will accelerate your score improvement.",
        impact: "medium",
        priority: 3,
      });
    } else if (score < 750) {
      generatedTips.push({
        id: "reach-excellent",
        icon: Target,
        title: "Push for Excellent Credit",
        description: "You're close to excellent credit! Maintain your good payment habits and your score will continue to climb toward the 750+ range.",
        impact: "medium",
        priority: 3,
      });
    }

    // Tips based on payment ratio
    const onTimeRatio = totalPayments > 0 ? onTimePayments / totalPayments : 0;
    
    if (onTimeRatio >= 0.9 && score >= 700) {
      generatedTips.push({
        id: "maintain-excellent",
        icon: Shield,
        title: "Maintain Your Excellent Standing",
        description: "Great job! You're in the top tier of reliable tenants. Continue your excellent payment habits to maintain your high credit score.",
        impact: "low",
        priority: 4,
      });
    } else if (onTimeRatio >= 0.7 && onTimeRatio < 0.9) {
      generatedTips.push({
        id: "improve-ratio",
        icon: TrendingUp,
        title: "Improve Your On-Time Ratio",
        description: `Currently ${Math.round(onTimeRatio * 100)}% of your payments are on-time. Reaching 90%+ will significantly boost your credit standing.`,
        impact: "medium",
        priority: 3,
      });
    }

    // General tips based on total payment count
    if (totalPayments < 6) {
      generatedTips.push({
        id: "build-history",
        icon: Calendar,
        title: "Continue Building History",
        description: "Credit scores become more reliable with more payment history. Keep up with your payments to establish a stronger track record.",
        impact: "medium",
        priority: 5,
      });
    }

    // Sort by priority
    return generatedTips.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [score, rating, onTimePayments, latePayments, missedPayments, totalPayments]);

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

  const getProgressMessage = () => {
    if (rating === "Excellent") {
      return "You're doing great! Keep up the excellent work.";
    } else if (rating === "Good") {
      return "You're on the right track. A few improvements can get you to excellent.";
    } else if (rating === "Fair") {
      return "There's room for improvement. Follow these tips to boost your score.";
    } else if (rating === "Poor") {
      return "Focus on the high-impact tips below to start improving your score.";
    }
    return "Start building your credit history with these tips.";
  };

  if (tips.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Credit Score Improvement Tips</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {tips.length} Tip{tips.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <CardDescription>{getProgressMessage()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tips.map((tip) => (
            <div 
              key={tip.id} 
              className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${
                  tip.impact === "high" 
                    ? "bg-red-500/10" 
                    : tip.impact === "medium" 
                      ? "bg-yellow-500/10" 
                      : "bg-green-500/10"
                }`}>
                  <tip.icon className={`h-5 w-5 ${
                    tip.impact === "high" 
                      ? "text-red-500" 
                      : tip.impact === "medium" 
                        ? "text-yellow-500" 
                        : "text-green-500"
                  }`} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{tip.title}</h4>
                  {getImpactBadge(tip.impact)}
                </div>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>

        {rating !== "Excellent" && rating !== "No History" && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="font-medium">Quick Win:</span>
              <span className="text-muted-foreground">
                Pay your next bill on time to add up to +10 points to your score.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
