
import { useMemo, useState, type ElementType } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell,
  Bot,
  Building2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LogOut,
  Plus,
  Settings,
  Shield,
  Ticket,
  TrendingUp,
  Users,
  ChartColumn,
  LayoutDashboard,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLogout } from "@/features/auth/hooks/useLogout";
import routes from "@/config/routes";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Role = "admin" | "manager" | "agent";

type IconType = ElementType;

interface MenuItem {
  label: string;
  to: string;
  icon: IconType;
  roles: readonly Role[];
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: readonly MenuItem[];
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getInitials(name?: string): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function Sidebar(): React.ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const logoutMutation = useLogout();

  const role: Role = (user?.role as Role) ?? "agent";

  /* ---------------------------------------------------------------------- */
  /* Navigation Model (static + safe)                                       */
  /* ---------------------------------------------------------------------- */

  const menuGroups: MenuGroup[] = useMemo(
    () => [
      {
        title: "Overview",
        items: [
          {
            label: "Dashboard",
            to: routes.dashboard,
            icon: LayoutDashboard,
            roles: ["admin", "manager", "agent"],
          },
          {
            label: "Analytics",
            to: routes.analytics,
            icon: ChartColumn,
            roles: ["admin", "manager"],
          },
          {
            label: "Agent Performance",
            to: routes.agents,
            icon: TrendingUp,
            roles: ["admin", "manager"],
          },
          {
            label: "My Performance",
            to: routes.myPerformance,
            icon: TrendingUp,
            roles: ["agent"],
          },
        ],
      },
      {
        title: "Operations",
        items: [
          {
            label: "Tickets",
            to: routes.tickets,
            icon: Ticket,
            roles: ["admin", "manager", "agent"],
          },
          {
            label: "Customers",
            to: routes.customers,
            icon: Users,
            roles: ["admin", "manager"],
          },
          {
            label: "Teams",
            to: routes.teams,
            icon: Shield,
            roles: ["admin", "manager"],
          },
        ],
      },
      {
        title: "Automation",
        items: [
          {
            label: "Workflows",
            to: routes.automation,
            icon: Bot,
            roles: ["admin"],
          },
        ],
      },
      {
        title: "System",
        items: [
          {
            label: "Settings",
            to: routes.settings,
            icon: Settings,
            roles: ["admin", "manager", "agent"],
          },
        ],
      },
    ],
    [],
  );

  /* ---------------------------------------------------------------------- */
  /* Role-based filtering                                                   */
  /* ---------------------------------------------------------------------- */

  const filteredGroups = useMemo(() => {
    return menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.roles.includes(role)),
      }))
      .filter((group) => group.items.length > 0);
  }, [menuGroups, role]);

  const initials = getInitials(user?.name);

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                */
  /* ---------------------------------------------------------------------- */

  const handleNotifications = () => {
    alert("Notifications clicked (hook up notification center)");
  };

  const handleHelp = () => {
    alert("Help clicked (hook up docs/chat)");
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <aside
      className={cn(
        "relative hidden h-screen flex-col border-r border-border/60 bg-sidebar text-sidebar-foreground",
        "overflow-visible transition-all duration-300 ease-in-out lg:flex",
        collapsed ? "w-18" : "w-72",
      )}
    >
      {/* Toggle button — pinned to right edge of aside, always on top */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute right-0 top-1/2 z-30 flex h-12 w-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md hover:bg-sidebar-accent"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-5.5 w-5.5" />
        ) : (
          <ChevronLeft className="h-5.5 w-5.5" />
        )}
      </button>
      {/* HEADER */}
      <div className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold">CRM Helpdesk</p>
                <p className="truncate text-xs text-sidebar-foreground/60">Enterprise Workspace</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE */}
      <div className="px-4 py-4">
        <NavLink
          to={routes.ticketCreate}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          {!collapsed && "Create Ticket"}
        </NavLink>
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <nav className="flex flex-col gap-6">
          {filteredGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase text-sidebar-foreground/40">
                  {group.title}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-2xl px-3 py-3",
                        collapsed ? "justify-center" : "gap-3",
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white",
                      )
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" />

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-sm font-medium">
                          {item.label}
                        </span>

                        {item.badge && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 font-semibold">
            {initials}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold">
                {user?.name ?? "—"}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60 capitalize">
                {user?.role ?? "—"}
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-sidebar-foreground/50">
              <span className="text-xs">v2.0.0</span>
              <span className="h-1 w-1 rounded-full bg-sidebar-foreground/30" />
              <span className="text-xs">PROD</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNotifications}
                className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-white/10 hover:text-white"
              >
                <Bell className="h-4 w-4" />
              </button>

              <button
                onClick={handleHelp}
                className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-white/10 hover:text-white"
              >
                <HelpCircle className="h-4 w-4" />
              </button>

              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-red-500/20 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}