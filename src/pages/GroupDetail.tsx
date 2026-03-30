import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, UserPlus, Pencil, Check } from "lucide-react";
import AddExpenseDialog from "@/components/AddExpenseDialog";
import EditExpenseDialog from "@/components/EditExpenseDialog";
import ExportButton from "@/components/ExportButton";
import { calculateBalances, CATEGORY_CONFIG } from "@/types/expense";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const { getGroup, deleteExpense, addMember, settleBalance } = useApp();
  const navigate = useNavigate();
  const group = getGroup(id || "");

  const [memberOpen, setMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [editingExpense, setEditingExpense] = useState<string | null>(null);

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Group not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/groups")}>
          Back to Groups
        </Button>
      </div>
    );
  }

  const balances = calculateBalances(group.members, group.expenses, group.settlements);
  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m.name]));

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      addMember(group.id, newMemberName.trim());
      setNewMemberName("");
      setMemberOpen(false);
    }
  };

  const handleSettle = (from: string, to: string, amount: number) => {
    settleBalance(group.id, from, to, amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/groups")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">{group.members.map((m) => m.name).join(", ")}</p>
        </div>
        <ExportButton group={group} />
        <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <UserPlus className="h-4 w-4" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Add Member</DialogTitle></DialogHeader>
            <div className="flex gap-2">
              <Input
                placeholder="Member name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
              />
              <Button onClick={handleAddMember}>Add</Button>
            </div>
          </DialogContent>
        </Dialog>
        <AddExpenseDialog group={group} />
      </div>

      {balances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Settlements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {balances.map((b, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                <span className="text-sm">
                  <span className="font-semibold text-destructive">{memberMap[b.from]}</span>
                  {" owes "}
                  <span className="font-semibold text-primary">{memberMap[b.to]}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold">₹{b.amount.toFixed(2)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => handleSettle(b.from, b.to, b.amount)}
                  >
                    <Check className="h-3 w-3" /> Settle
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {balances.length === 0 && group.expenses.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-6 text-center">
            <p className="font-display font-semibold text-primary">🎉 All settled up!</p>
            <p className="text-sm text-muted-foreground">No pending balances in this group.</p>
          </CardContent>
        </Card>
      )}

      {group.settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Settlement History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...group.settlements].reverse().map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm">
                <span>
                  <span className="font-medium">{memberMap[s.from]}</span> paid{" "}
                  <span className="font-medium">{memberMap[s.to]}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-display font-semibold">₹{s.amount.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(s.settledAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">
          Expenses ({group.expenses.length})
        </h2>
        {group.expenses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              No expenses yet. Add your first expense!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {[...group.expenses].reverse().map((expense) => {
              const catConfig = CATEGORY_CONFIG[expense.category];
              return (
                <Card key={expense.id} className="animate-fade-in">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-lg">
                      {catConfig.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Paid by {memberMap[expense.paidBy]} · {catConfig.label} · {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-display font-bold text-primary">₹{expense.amount.toFixed(2)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setEditingExpense(expense.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteExpense(group.id, expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {editingExpense === expense.id && (
                      <EditExpenseDialog
                        group={group}
                        expense={expense}
                        open={true}
                        onOpenChange={(open) => !open && setEditingExpense(null)}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
