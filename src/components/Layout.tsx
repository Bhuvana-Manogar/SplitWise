import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, LayoutDashboard, PieChart } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/groups", icon: Users, label: "Groups" },
  { to: "/insights", icon: PieChart, label: "Insights" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">$</span>
            </div>
            <span className="font-display text-xl font-bold tracking-tight">SplitWise</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
              const active = pathname === to || (to !== "/" && pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="container py-8 animate-fade-in">{children}</main>
    </div>
  );
}
