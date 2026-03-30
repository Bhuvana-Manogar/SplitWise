import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_CONFIG, Expense } from "@/types/expense";
import { TrendingUp, Lightbulb } from "lucide-react";
import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

function getInsights(expenses: Expense[]): string[] {
  if (expenses.length === 0) return ["Add some expenses to see AI-powered insights!"];

  const insights: string[] = [];
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const catTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });

  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    const config = CATEGORY_CONFIG[topCat[0] as keyof typeof CATEGORY_CONFIG];
    const pct = ((topCat[1] / total) * 100).toFixed(0);
    insights.push(`${config.emoji} ${config.label} is your biggest expense category at ${pct}% of total spending.`);
  }

  const avgExpense = total / expenses.length;
  insights.push(`📊 Your average expense is ₹${avgExpense.toFixed(2)} across ${expenses.length} transactions.`);

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thisWeek = expenses.filter((e) => new Date(e.date) >= oneWeekAgo);
  const lastWeek = expenses.filter((e) => {
    const d = new Date(e.date);
    return d >= twoWeeksAgo && d < oneWeekAgo;
  });

  if (thisWeek.length > 0 && lastWeek.length > 0) {
    const thisTotal = thisWeek.reduce((s, e) => s + e.amount, 0);
    const lastTotal = lastWeek.reduce((s, e) => s + e.amount, 0);
    if (lastTotal > 0) {
      const change = ((thisTotal - lastTotal) / lastTotal) * 100;
      if (change > 0) {
        insights.push(`📈 You spent ${change.toFixed(0)}% more this week compared to last week.`);
      } else {
        insights.push(`📉 Great job! You spent ${Math.abs(change).toFixed(0)}% less this week.`);
      }
    }
  }

  const biggestExpense = expenses.reduce((max, e) => (e.amount > max.amount ? e : max), expenses[0]);
  insights.push(`💰 Your biggest expense was "${biggestExpense.description}" at ₹${biggestExpense.amount.toFixed(2)}.`);

  return insights;
}

const CHART_COLORS = [
  "hsl(162, 72%, 38%)",
  "hsl(38, 92%, 50%)",
  "hsl(217, 91%, 60%)",
  "hsl(25, 95%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(142, 71%, 45%)",
  "hsl(280, 65%, 60%)",
  "hsl(220, 10%, 46%)",
];

export default function Insights() {
  const { groups } = useApp();
  const allExpenses = groups.flatMap((g) => g.expenses);
  const total = allExpenses.reduce((s, e) => s + e.amount, 0);

  const pieData = useMemo(() => {
    const cats: Record<string, number> = {};
    allExpenses.forEach((e) => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    });
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({
        name: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG].label,
        value: Math.round(amt * 100) / 100,
      }));
  }, [allExpenses]);

  const barData = useMemo(() => {
    const grouped: Record<string, number> = {};
    allExpenses.forEach((e) => {
      const day = new Date(e.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      grouped[day] = (grouped[day] || 0) + e.amount;
    });
    return Object.entries(grouped).map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }));
  }, [allExpenses]);

  const insights = useMemo(() => getInsights(allExpenses), [allExpenses]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Spending Insights</h1>
        <p className="text-muted-foreground">AI-powered analysis of your expenses</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Lightbulb className="h-5 w-5 text-primary" /> Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight, i) => (
            <p key={i} className="text-sm leading-relaxed">{insight}</p>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses to analyze</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Daily Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses to chart</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                  <Bar dataKey="amount" fill="hsl(162, 72%, 38%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="font-display text-2xl font-bold">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="font-display text-2xl font-bold">{allExpenses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Groups</p>
            <p className="font-display text-2xl font-bold">{groups.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
