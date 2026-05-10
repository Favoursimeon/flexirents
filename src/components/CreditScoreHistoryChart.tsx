import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PaymentRecord {
  id: string;
  due_date: string;
  payment_date: string | null;
  status: string;
  amount: number;
}

interface CreditScoreHistoryChartProps {
  paymentHistory: PaymentRecord[];
}

interface MonthlyScore {
  month: string;
  score: number;
  onTime: number;
  late: number;
  missed: number;
}

const calculateScoreForPayments = (payments: PaymentRecord[]): number => {
  if (payments.length === 0) return 300;

  let onTimePayments = 0;
  let latePayments = 0;
  let missedPayments = 0;

  payments.forEach((payment) => {
    if (payment.status === "paid" && payment.payment_date) {
      const dueDate = new Date(payment.due_date);
      const paymentDate = new Date(payment.payment_date);
      const daysDiff = differenceInDays(paymentDate, dueDate);

      if (daysDiff <= 0) {
        onTimePayments++;
      } else if (daysDiff <= 30) {
        latePayments++;
      } else {
        missedPayments++;
      }
    } else if (payment.status === "overdue" || payment.status === "missed") {
      missedPayments++;
    }
  });

  const totalPayments = onTimePayments + latePayments + missedPayments;
  if (totalPayments === 0) return 300;

  const onTimeRatio = onTimePayments / totalPayments;
  const lateRatio = latePayments / totalPayments;
  const missedRatio = missedPayments / totalPayments;

  const baseScore = 300;
  const maxScore = 850;
  const scoreRange = maxScore - baseScore;

  const score = baseScore + scoreRange * (onTimeRatio * 1.0 + lateRatio * 0.5 - missedRatio * 0.3);

  return Math.round(Math.max(300, Math.min(850, score)));
};

export const CreditScoreHistoryChart = ({ paymentHistory }: CreditScoreHistoryChartProps) => {
  const monthlyScores = useMemo((): MonthlyScore[] => {
    const scores: MonthlyScore[] = [];
    const now = new Date();

    // Generate scores for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Get all payments up to this month
      const paymentsUpToMonth = paymentHistory.filter((payment) => {
        const dueDate = new Date(payment.due_date);
        return dueDate <= monthEnd;
      });

      // Count payments in this specific month
      const paymentsThisMonth = paymentHistory.filter((payment) => {
        const dueDate = new Date(payment.due_date);
        return dueDate >= monthStart && dueDate <= monthEnd;
      });

      let onTime = 0;
      let late = 0;
      let missed = 0;

      paymentsThisMonth.forEach((payment) => {
        if (payment.status === "paid" && payment.payment_date) {
          const dueDate = new Date(payment.due_date);
          const paymentDate = new Date(payment.payment_date);
          const daysDiff = differenceInDays(paymentDate, dueDate);

          if (daysDiff <= 0) {
            onTime++;
          } else if (daysDiff <= 30) {
            late++;
          } else {
            missed++;
          }
        } else if (payment.status === "overdue" || payment.status === "missed") {
          missed++;
        }
      });

      scores.push({
        month: format(monthDate, "MMM yyyy"),
        score: calculateScoreForPayments(paymentsUpToMonth),
        onTime,
        late,
        missed,
      });
    }

    return scores;
  }, [paymentHistory]);

  const trend = useMemo(() => {
    if (monthlyScores.length < 2) return "neutral";
    const lastScore = monthlyScores[monthlyScores.length - 1].score;
    const previousScore = monthlyScores[monthlyScores.length - 2].score;
    if (lastScore > previousScore) return "up";
    if (lastScore < previousScore) return "down";
    return "neutral";
  }, [monthlyScores]);

  const currentScore = monthlyScores[monthlyScores.length - 1]?.score ?? 300;
  const scoreChange = monthlyScores.length >= 2 
    ? currentScore - monthlyScores[monthlyScores.length - 2].score 
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 750) return "hsl(var(--chart-2))"; // Green - Excellent
    if (score >= 650) return "hsl(var(--chart-3))"; // Blue - Good
    if (score >= 550) return "hsl(var(--chart-4))"; // Yellow - Fair
    return "hsl(var(--chart-5))"; // Red - Poor
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Credit Score History</CardTitle>
          <div className="flex items-center gap-2">
            {trend === "up" && (
              <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                +{scoreChange} pts
              </div>
            )}
            {trend === "down" && (
              <div className="flex items-center text-red-600 dark:text-red-400 text-sm">
                <TrendingDown className="h-4 w-4 mr-1" />
                {scoreChange} pts
              </div>
            )}
            {trend === "neutral" && (
              <div className="flex items-center text-muted-foreground text-sm">
                <Minus className="h-4 w-4 mr-1" />
                No change
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyScores} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[300, 850]} 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [value, "Score"]}
              />
              <ReferenceLine y={750} stroke="hsl(var(--chart-2))" strokeDasharray="5 5" label={{ value: "Excellent", position: "right", fontSize: 10 }} />
              <ReferenceLine y={650} stroke="hsl(var(--chart-3))" strokeDasharray="5 5" label={{ value: "Good", position: "right", fontSize: 10 }} />
              <ReferenceLine y={550} stroke="hsl(var(--chart-4))" strokeDasharray="5 5" label={{ value: "Fair", position: "right", fontSize: 10 }} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke={getScoreColor(currentScore)}
                strokeWidth={3}
                dot={{ fill: getScoreColor(currentScore), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Excellent (750+)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Good (650-749)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Fair (550-649)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Poor (&lt;550)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
