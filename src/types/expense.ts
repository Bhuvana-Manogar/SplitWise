export interface Member {
  id: string;
  name: string;
  avatar?: string;
}

export interface ExpenseSplit {
  memberId: string;
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  splits: ExpenseSplit[];
  category: ExpenseCategory;
  date: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  settledAt: string;
}

export type ExpenseCategory =
  | "food"
  | "travel"
  | "rent"
  | "entertainment"
  | "shopping"
  | "utilities"
  | "health"
  | "other";

export interface Group {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  createdAt: string;
}

export interface Balance {
  from: string;
  to: string;
  amount: number;
}

export const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
  food: { label: "Food & Drinks", emoji: "🍕", color: "hsl(var(--warning))" },
  travel: { label: "Travel", emoji: "✈️", color: "hsl(var(--info))" },
  rent: { label: "Rent", emoji: "🏠", color: "hsl(var(--primary))" },
  entertainment: { label: "Entertainment", emoji: "🎬", color: "hsl(var(--accent))" },
  shopping: { label: "Shopping", emoji: "🛍️", color: "hsl(var(--destructive))" },
  utilities: { label: "Utilities", emoji: "💡", color: "hsl(var(--success))" },
  health: { label: "Health", emoji: "🏥", color: "hsl(142, 71%, 45%)" },
  other: { label: "Other", emoji: "📦", color: "hsl(var(--muted-foreground))" },
};

export function categorizeExpense(description: string): ExpenseCategory {
  const lower = description.toLowerCase();
  if (/food|lunch|dinner|breakfast|coffee|pizza|restaurant|bar|drink|beer|snack|grocery|meal/.test(lower)) return "food";
  if (/uber|lyft|taxi|flight|train|bus|gas|fuel|parking|toll|travel|trip|hotel|airbnb/.test(lower)) return "travel";
  if (/rent|mortgage|lease|housing/.test(lower)) return "rent";
  if (/movie|concert|game|netflix|spotify|ticket|show|party|club/.test(lower)) return "entertainment";
  if (/shop|buy|amazon|clothes|shoes|gift/.test(lower)) return "shopping";
  if (/electric|water|internet|phone|bill|utility|wifi/.test(lower)) return "utilities";
  if (/doctor|medicine|pharmacy|hospital|health|gym|fitness/.test(lower)) return "health";
  return "other";
}

export function calculateBalances(members: Member[], expenses: Expense[], settlements: Settlement[] = []): Balance[] {
  const netBalances: Record<string, number> = {};
  members.forEach((m) => (netBalances[m.id] = 0));

  expenses.forEach((expense) => {
    netBalances[expense.paidBy] = (netBalances[expense.paidBy] || 0) + expense.amount;
    expense.splits.forEach((split) => {
      netBalances[split.memberId] = (netBalances[split.memberId] || 0) - split.amount;
    });
  });

  // Apply settlements
  settlements.forEach((s) => {
    netBalances[s.from] = (netBalances[s.from] || 0) + s.amount;
    netBalances[s.to] = (netBalances[s.to] || 0) - s.amount;
  });

  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  Object.entries(netBalances).forEach(([id, amount]) => {
    if (amount < -0.01) debtors.push({ id, amount: -amount });
    else if (amount > 0.01) creditors.push({ id, amount });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const result: Balance[] = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0.01) {
      result.push({ from: debtors[i].id, to: creditors[j].id, amount: Math.round(amount * 100) / 100 });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return result;
}
