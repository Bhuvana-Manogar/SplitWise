import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Group, ExpenseSplit } from "@/types/expense";

export default function AddExpenseDialog({ group }: { group: Group }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(group.members[0]?.id || "");
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const { addExpense } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0 || !paidBy) return;

    let splits: ExpenseSplit[];
    if (splitType === "equal") {
      const perPerson = Math.round((numAmount / group.members.length) * 100) / 100;
      splits = group.members.map((m) => ({ memberId: m.id, amount: perPerson }));
    } else {
      splits = group.members.map((m) => ({
        memberId: m.id,
        amount: parseFloat(customSplits[m.id] || "0") || 0,
      }));
    }

    addExpense(group.id, description.trim(), numAmount, paidBy, splits);
    setDescription("");
    setAmount("");
    setCustomSplits({});
    setOpen(false);
  };

  const customTotal = Object.values(customSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const numAmount = parseFloat(amount) || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="e.g. Dinner at restaurant" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Paid by</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {group.members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tabs value={splitType} onValueChange={(v) => setSplitType(v as "equal" | "custom")}>
            <TabsList className="w-full">
              <TabsTrigger value="equal" className="flex-1">Split Equally</TabsTrigger>
              <TabsTrigger value="custom" className="flex-1">Custom Split</TabsTrigger>
            </TabsList>
            <TabsContent value="equal">
              <p className="text-sm text-muted-foreground">
                ₹{numAmount > 0 ? (numAmount / group.members.length).toFixed(2) : "0.00"} per person
              </p>
            </TabsContent>
            <TabsContent value="custom" className="space-y-2">
              {group.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="w-24 truncate text-sm">{m.name}</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={customSplits[m.id] || ""}
                    onChange={(e) => setCustomSplits({ ...customSplits, [m.id]: e.target.value })}
                    className="flex-1"
                  />
                </div>
              ))}
              <p className={`text-sm ${Math.abs(customTotal - numAmount) < 0.01 ? "text-success" : "text-destructive"}`}>
                Total: ₹{customTotal.toFixed(2)} / ₹{numAmount.toFixed(2)}
              </p>
            </TabsContent>
          </Tabs>
          <Button
            type="submit"
            className="w-full"
            disabled={!description.trim() || numAmount <= 0 || (splitType === "custom" && Math.abs(customTotal - numAmount) > 0.01)}
          >
            Add Expense
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
