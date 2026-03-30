import { useApp } from "@/context/AppContext";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Receipt, TrendingUp, ArrowRight } from "lucide-react";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import { calculateBalances, CATEGORY_CONFIG } from "@/types/expense";

export default function Dashboard() {
  const { groups } = useApp();
  const allExpenses = groups.flatMap((g) => g.expenses);
  const totalSpent = allExpenses.reduce((s, e) => s + e.amount, 0);
  const totalGroups = groups.length;
  const totalSettlements = groups.reduce(
    (s, g) => s + calculateBalances(g.members, g.expenses).length,
    0
  );

  const categoryBreakdown = allExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Track and split expenses with friends</p>
        </div>
        <CreateGroupDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold">₹{totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold">{totalGroups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Settlements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold">{totalSettlements}</p>
          </CardContent>
        </Card>
      </div>

      {topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategories.map(([cat, amt]) => {
                const config = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG];
                const pct = totalSpent > 0 ? (amt / totalSpent) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {config.emoji} {config.label}
                      </span>
                      <span className="font-medium">₹{amt.toFixed(2)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: config.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {groups.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Your Groups</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => {
              const total = g.expenses.reduce((s, e) => s + e.amount, 0);
              return (
                <Link key={g.id} to={`/groups/${g.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="font-display font-semibold">{g.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {g.members.length} members · {g.expenses.length} expenses
                        </p>
                        <p className="mt-1 text-sm font-medium text-primary">
                          ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-semibold">No groups yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">Create your first group to start splitting expenses</p>
            <CreateGroupDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
