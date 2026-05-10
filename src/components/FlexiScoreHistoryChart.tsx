import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

interface ScoreRecord {
  total_score: number;
  tier: string;
  recorded_at: string;
}

interface FlexiScoreHistoryChartProps {
  history: ScoreRecord[];
}

export const FlexiScoreHistoryChart = ({ history }: FlexiScoreHistoryChartProps) => {
  const chartData = useMemo(() => {
    return history
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map((record) => ({
        date: format(new Date(record.recorded_at), "MMM dd"),
        score: Number(record.total_score),
        tier: record.tier,
      }));
  }, [history]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return "neutral";
    const last = chartData[chartData.length - 1].score;
    const prev = chartData[chartData.length - 2].score;
    if (last > prev) return "up";
    if (last < prev) return "down";
    return "neutral";
  }, [chartData]);

  const scoreChange = chartData.length >= 2
    ? chartData[chartData.length - 1].score - chartData[chartData.length - 2].score
    : 0;

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Score History</CardTitle>
          </div>
          <CardDescription>Your score trend will appear here once you save your financial data.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Flexi Score History</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {trend === "up" && (
              <div className="flex items-center text-green-600 text-sm font-medium">
                <TrendingUp className="h-4 w-4 mr-1" />+{scoreChange} pts
              </div>
            )}
            {trend === "down" && (
              <div className="flex items-center text-red-600 text-sm font-medium">
                <TrendingDown className="h-4 w-4 mr-1" />{scoreChange} pts
              </div>
            )}
            {trend === "neutral" && (
              <div className="flex items-center text-muted-foreground text-sm">
                <Minus className="h-4 w-4 mr-1" />No change
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value}/100`, "Score"]}
              />
              <ReferenceLine y={75} stroke="hsl(142, 76%, 36%)" strokeDasharray="5 5" label={{ value: "Tier A", position: "right", fontSize: 9 }} />
              <ReferenceLine y={60} stroke="hsl(217, 91%, 60%)" strokeDasharray="5 5" label={{ value: "Tier B", position: "right", fontSize: 9 }} />
              <ReferenceLine y={45} stroke="hsl(45, 93%, 47%)" strokeDasharray="5 5" label={{ value: "Tier C", position: "right", fontSize: 9 }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> A (75+)</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> B (60-74)</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /> C (45-59)</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> D (&lt;45)</span>
        </div>
      </CardContent>
    </Card>
  );
};
