

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
| Clean, type-safe, protected routing layer
|--------------------------------------------------------------------------
*/

import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import routes from "@/config/routes";

/* -------------------------------------------------------------------------- */
/* Auth                                                                     */
/* -------------------------------------------------------------------------- */

import LoginPage from "@/features/auth/pages/LoginPage";

/* -------------------------------------------------------------------------- */
/* Dashboard                                                              */
/* -------------------------------------------------------------------------- */

import DashboardPage from "@/features/dashboard/pages/DashboardPage";

/* -------------------------------------------------------------------------- */
/* Tickets                                                                */
/* -------------------------------------------------------------------------- */

import TicketsPage from "@/features/tickets/pages/TicketsPage";
import CreateTicketPage from "@/features/tickets/pages/CreateTicketPage";
import TicketDetailsPage from "@/features/tickets/pages/TicketDetailsPage";
import EditTicketPage from "@/features/tickets/pages/EditTicketPage";

/* -------------------------------------------------------------------------- */
/* Analytics                                                              */
/* -------------------------------------------------------------------------- */

import AnalyticsPage from "@/features/analytics/pages/AnalyticsPage";
import AgentPerformancePage from "@/features/analytics/pages/AgentPerformancePage";
import AgentDetailPage from "@/features/analytics/pages/AgentDetailPage";
import MyPerformancePage from "@/features/analytics/pages/MyPerformancePage";

/* -------------------------------------------------------------------------- */
/* CRM Modules                                                            */
/* -------------------------------------------------------------------------- */

import CustomersPage from "@/features/customers/pages/CustomersPage";
import TeamsPage from "@/features/teams/pages/TeamsPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";
import AutomationPage from "@/features/automation/pages/AutomationPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
import KnowledgeBasePage from "@/features/knowledgeBase/pages/KnowledgeBasePage";
import EmailTemplatesPage from "@/features/emailTemplates/pages/EmailTemplatesPage";
import SLAAnalyticsPage from "@/features/slaAnalytics/pages/SLAAnalyticsPage";
import AgentScoringPage from "@/features/agentScoring/pages/AgentScoringPage";

/* -------------------------------------------------------------------------- */
/* 404 Page                                                                */
/* -------------------------------------------------------------------------- */

function NotFoundPage(): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">Page not found</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Protected Routes Wrapper                                                 */
/* -------------------------------------------------------------------------- */

function ProtectedRoutes(): ReactElement {
  return (
    <Route element={<ProtectedRoute />}>
      <Route path={routes.dashboard} element={<DashboardPage />} />

      {/* Tickets */}
      <Route path={routes.tickets} element={<TicketsPage />} />
      <Route path={routes.ticketCreate} element={<CreateTicketPage />} />
      <Route
        path={routes.ticketDetails}
        element={<TicketDetailsPage />}
      />
      <Route path={routes.ticketEdit} element={<EditTicketPage />} />

      {/* Analytics */}
      <Route path={routes.analytics} element={<AnalyticsPage />} />
      <Route path={routes.agents} element={<AgentPerformancePage />} />
      <Route path={`${routes.agents}/:id`} element={<AgentDetailPage />} />
      <Route path={routes.myPerformance} element={<MyPerformancePage />} />

      {/* CRM Modules */}
      <Route path={routes.customers} element={<CustomersPage />} />
      <Route path={routes.teams} element={<TeamsPage />} />
      <Route path={routes.reports} element={<ReportsPage />} />
      <Route path={routes.automation} element={<AutomationPage />} />
      <Route path={routes.settings} element={<SettingsPage />} />
      <Route path={routes.knowledgeBase} element={<KnowledgeBasePage />} />
      <Route path={routes.emailTemplates} element={<EmailTemplatesPage />} />
      <Route path={routes.slaAnalytics} element={<SLAAnalyticsPage />} />
      <Route path="/analytics/agent-scoring" element={<AgentScoringPage />} />
    </Route>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Router                                                             */
/* -------------------------------------------------------------------------- */

export default function AppRoutes(): ReactElement {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={routes.login} element={<LoginPage />} />

      {/* Root redirect */}
      <Route
        path="/"
        element={<Navigate to={routes.dashboard} replace />}
      />

      {/* Protected Routes */}
      {ProtectedRoutes()}

      {/* 404 Handling */}
      <Route path={routes.notFound} element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to={routes.notFound} replace />} />
    </Routes>
  );
}