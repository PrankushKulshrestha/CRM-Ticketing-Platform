
import { useMemo } from "react";
import {
  Menu,
  LayoutDashboard,
  Ticket,
  ChartColumn,
  Users,
  Shield,
  Settings,
  Bot,
  FileText,
  LucideIcon,
} from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import SidebarItem from "./SidebarItem";
import { useAuth } from "@/app/providers/AuthProvider";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Role = "admin" | "manager" | "agent";


interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  roles: readonly Role[];
}

/* -------------------------------------------------------------------------- */
/* Navigation Config                                                          */
/* -------------------------------------------------------------------------- */

const NAV_ITEMS: readonly NavItem[] = [
  { to: "/dashboard",  icon: LayoutDashboard, label: "Dashboard",  roles: ["admin", "manager", "agent"] },
  { to: "/tickets",    icon: Ticket,          label: "Tickets",    roles: ["admin", "manager", "agent"] },
  { to: "/customers",  icon: Users,           label: "Customers",  roles: ["admin", "manager"] },
  { to: "/analytics",  icon: ChartColumn,     label: "Analytics",  roles: ["admin", "manager"] },
  { to: "/teams",      icon: Shield,          label: "Teams",      roles: ["admin", "manager"] },
  { to: "/reports",    icon: FileText,        label: "Reports",    roles: ["admin", "manager"] },
  { to: "/automation", icon: Bot,             label: "Automation", roles: ["admin"] },
  { to: "/settings",   icon: Settings,        label: "Settings",   roles: ["admin", "manager"] },
] as const;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function MobileSidebar(): React.ReactElement {
  const { user } = useAuth();

  const role: Role = (user?.role as Role) ?? "agent";

  const visibleItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => item.roles.includes(role));
  }, [role]);

  return (
    <Sheet>
      {/* Trigger */}
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      {/* Drawer */}
      <SheetContent side="left" className="w-64 p-0">
        {/* Header */}
        <div className="border-b px-6 py-5">
          <h1 className="text-lg font-semibold tracking-tight">
            CRM Helpdesk
          </h1>
          <p className="text-xs text-muted-foreground">
            Navigation
          </p>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Mobile navigation"
          className="flex flex-col gap-1 p-4"
        >
          {visibleItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}