import { useApp } from "@/context/AppContext";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trash2, Users } from "lucide-react";
import CreateGroupDialog from "@/components/CreateGroupDialog";

export default function Groups() {
  const { groups, deleteGroup } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">Groups</h1>
        <CreateGroupDialog />
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-semibold">No groups yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">Get started by creating a group</p>
            <CreateGroupDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => {
            const total = g.expenses.reduce((s, e) => s + e.amount, 0);
            return (
              <Card key={g.id} className="group relative transition-shadow hover:shadow-md">
                <Link to={`/groups/${g.id}`}>
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
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.preventDefault(); deleteGroup(g.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
