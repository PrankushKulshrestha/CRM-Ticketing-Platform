import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  ChartColumn,
  Settings,
  TrendingUp,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/providers/AuthProvider";
import routes from "@/config/routes";

type Role = "admin" | "manager" | "agent";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles: readonly Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: routes.dashboard, icon: LayoutDashboard, roles: ["admin", "manager", "agent"] },
  { label: "Tickets",   to: routes.tickets,   icon: Ticket,          roles: ["admin", "manager", "agent"] },
  { label: "New",       to: routes.ticketCreate, icon: Plus,         roles: ["admin", "manager", "agent"] },
  { label: "Analytics", to: routes.analytics,  icon: ChartColumn,    roles: ["admin", "manager"] },
  { label: "Perf",      to: routes.myPerformance, icon: TrendingUp,  roles: ["agent"] },
  { label: "Settings",  to: routes.settings,   icon: Settings,       roles: ["admin", "manager", "agent"] },
];

export default function BottomNav(): React.ReactElement {
  const { user } = useAuth();
  const role = (user?.role as Role) ?? "agent";

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border/60 bg-sidebar/95 backdrop-blur-xl lg:hidden"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to !== routes.tickets}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              item.to === routes.ticketCreate
                ? "text-primary-foreground"
                : isActive
                  ? "text-white"
                  : "text-sidebar-foreground/60 hover:text-white",
            )
          }
        >
          {item.to === routes.ticketCreate ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-lg">
              <item.icon className="h-5 w-5" />
            </div>
          ) : (
            <>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
