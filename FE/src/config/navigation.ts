

/*
|--------------------------------------------------------------------------
| Application Navigation Configuration
|--------------------------------------------------------------------------
| Fully typed, immutable, permission-aware navigation schema
|--------------------------------------------------------------------------
*/

import routes from "./routes";
import { PERMISSIONS, type Permission } from "./permissions";

/* -------------------------------------------------------------------------- */
/* Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface NavItem {
  readonly label: string;
  readonly href: string;

  /**
   * Optional permission required to access this route.
   * If undefined → visible to all authenticated users.
   */
  readonly permission?: Permission;
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                */
/* -------------------------------------------------------------------------- */

export const navigation = Object.freeze([
  {
    label: "Dashboard",
    href: routes.dashboard,
    // Public for authenticated users
  },

  {
    label: "Tickets",
    href: routes.tickets,
    permission: PERMISSIONS.TICKETS_READ,
  },

  {
    label: "Customers",
    href: routes.customers,
    permission: PERMISSIONS.CUSTOMERS_READ,
  },

  {
    label: "Knowledge Base",
    href: routes.knowledgeBase,
    permission: PERMISSIONS.TICKETS_READ,
  },

  {
    label: "Agent Scoring",
    href: "/analytics/agent-scoring",
    permission: PERMISSIONS.ANALYTICS_READ,
  },

  {
    label: "SLA Analytics",
    href: routes.slaAnalytics,
    permission: PERMISSIONS.ANALYTICS_READ,
  },

  {
    label: "Analytics",
    href: routes.analytics,
    permission: PERMISSIONS.ANALYTICS_READ,
  },

  {
    label: "Reports",
    href: routes.reports,
    permission: PERMISSIONS.REPORTS_READ,
  },

  {
    label: "Teams",
    href: routes.teams,
    permission: PERMISSIONS.TEAMS_READ,
  },

  {
    label: "Automation",
    href: routes.automation,
    permission: PERMISSIONS.AUTOMATION_MANAGE,
  },

  {
    label: "Settings",
    href: routes.settings,
    permission: PERMISSIONS.SETTINGS_MANAGE,
  },
] as const satisfies readonly NavItem[]);

/* -------------------------------------------------------------------------- */

export default navigation;