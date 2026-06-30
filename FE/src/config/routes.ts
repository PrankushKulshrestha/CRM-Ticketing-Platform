
/*
|--------------------------------------------------------------------------
| Application Routes (Frontend)
|--------------------------------------------------------------------------
| Fully typed, immutable, scalable routing system
|--------------------------------------------------------------------------
*/

/* -------------------------------------------------------------------------- */
/* Public Routes                                                              */
/* -------------------------------------------------------------------------- */

export const PUBLIC_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "/404",
} as const;

export type PublicRoute =
  (typeof PUBLIC_ROUTES)[keyof typeof PUBLIC_ROUTES];

/* -------------------------------------------------------------------------- */
/* Dashboard Routes                                                           */
/* -------------------------------------------------------------------------- */

export const DASHBOARD_ROUTES = {
  DASHBOARD: "/dashboard",
} as const;

/* -------------------------------------------------------------------------- */
/* Ticket Routes                                                              */
/* -------------------------------------------------------------------------- */

export const TICKET_ROUTES = {
  LIST: "/tickets",
  CREATE: "/tickets/create",
  DETAILS: "/tickets/:id",
  EDIT: "/tickets/:id/edit",
} as const;

export const TICKET_PATHS = {
  details: (id: string | number) => `/tickets/${id}`,
  edit: (id: string | number) => `/tickets/${id}/edit`,
} as const;

/* -------------------------------------------------------------------------- */
/* User Routes                                                                */
/* -------------------------------------------------------------------------- */

export const USER_ROUTES = {
  LIST: "/users",
  DETAILS: "/users/:id",
  PROFILE: "/profile",
} as const;

export const USER_PATHS = {
  details: (id: string | number) => `/users/${id}`,
} as const;

/* -------------------------------------------------------------------------- */
/* Analytics Routes                                                           */
/* -------------------------------------------------------------------------- */

export const ANALYTICS_ROUTES = {
  ROOT: "/analytics",
  REPORTS: "/reports",
  AGENTS: "/analytics/agents",
  MY_PERFORMANCE: "/analytics/agents/me",
  SLA_ANALYTICS: "/analytics/sla",
} as const;

/* -------------------------------------------------------------------------- */
/* CRM Routes                                                                 */
/* -------------------------------------------------------------------------- */

export const CRM_ROUTES = {
  CUSTOMERS: "/customers",
  TEAMS: "/teams",
  AUTOMATION: "/automation",
  KNOWLEDGE_BASE: "/knowledge-base",
} as const;

/* -------------------------------------------------------------------------- */
/* Settings Routes                                                            */
/* -------------------------------------------------------------------------- */

export const SETTINGS_ROUTES = {
  ROOT: "/settings",
} as const;

/* -------------------------------------------------------------------------- */
/* Combined Routes                                                            */
/* -------------------------------------------------------------------------- */

export const ROUTES = {
  ...PUBLIC_ROUTES,
  ...DASHBOARD_ROUTES,
  ...TICKET_ROUTES,
  ...USER_ROUTES,
  ...ANALYTICS_ROUTES,
  ...CRM_ROUTES,
  ...SETTINGS_ROUTES,
} as const;

export type RouteValue =
  (typeof ROUTES)[keyof typeof ROUTES];

/* -------------------------------------------------------------------------- */
/* Route Groups                                                               */
/* -------------------------------------------------------------------------- */

export const ROUTE_GROUPS = {
  public: PUBLIC_ROUTES,
  dashboard: DASHBOARD_ROUTES,
  tickets: TICKET_ROUTES,
  users: USER_ROUTES,
  analytics: ANALYTICS_ROUTES,
  crm: CRM_ROUTES,
  settings: SETTINGS_ROUTES,
} as const;

/* -------------------------------------------------------------------------- */
/* Route Lists                                                                */
/* -------------------------------------------------------------------------- */

export const PUBLIC_ROUTE_LIST = Object.values(
  PUBLIC_ROUTES,
) as readonly PublicRoute[];

export const PROTECTED_ROUTE_LIST = Object.values({
  ...DASHBOARD_ROUTES,
  ...TICKET_ROUTES,
  ...USER_ROUTES,
  ...ANALYTICS_ROUTES,
  ...CRM_ROUTES,
  ...SETTINGS_ROUTES,
}) as readonly RouteValue[];

/* -------------------------------------------------------------------------- */
/* Route Guards                                                               */
/* -------------------------------------------------------------------------- */

export function isPublicRoute(route: string): route is PublicRoute {
  return (PUBLIC_ROUTE_LIST as readonly string[]).includes(route);
}

export function isProtectedRoute(route: string): route is RouteValue {
  return (PROTECTED_ROUTE_LIST as readonly string[]).includes(route);
}

/* -------------------------------------------------------------------------- */
/* Legacy Compatibility Layer                                                 */
/* -------------------------------------------------------------------------- */

const routes = {
  home: PUBLIC_ROUTES.HOME,
  login: PUBLIC_ROUTES.LOGIN,

  dashboard: DASHBOARD_ROUTES.DASHBOARD,

  tickets: TICKET_ROUTES.LIST,
  ticketCreate: TICKET_ROUTES.CREATE,
  ticketDetails: TICKET_ROUTES.DETAILS,
  ticketEdit: TICKET_ROUTES.EDIT,

  users: USER_ROUTES.LIST,
  userDetails: USER_ROUTES.DETAILS,

  analytics: ANALYTICS_ROUTES.ROOT,
  reports: ANALYTICS_ROUTES.REPORTS,
  agents: ANALYTICS_ROUTES.AGENTS,
  myPerformance: ANALYTICS_ROUTES.MY_PERFORMANCE,
  slaAnalytics: ANALYTICS_ROUTES.SLA_ANALYTICS,

  customers: CRM_ROUTES.CUSTOMERS,
  teams: CRM_ROUTES.TEAMS,
  automation: CRM_ROUTES.AUTOMATION,
  knowledgeBase: CRM_ROUTES.KNOWLEDGE_BASE,

  settings: SETTINGS_ROUTES.ROOT,

  notFound: PUBLIC_ROUTES.NOT_FOUND,
} as const;

export default routes;