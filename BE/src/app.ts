
import express, { type Application } from "express";

import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";

/* Routes */
import authRoutes from "./routes/auth.routes";
import ticketRoutes from "./routes/ticket.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import analyticsRoutes from "./routes/analytics.routes";
import healthRoutes from "./routes/health.routes";
import userRoutes from "./routes/user.routes";
import customerRoutes from "./routes/customer.routes";
import teamRoutes from "./routes/team.routes";
import automationRoutes from "./routes/automation.routes";
import slaRoutes from "./routes/sla.routes";
import reportsRoutes from "./routes/reports.routes";
import knowledgeBaseRoutes from "./routes/knowledgeBase.routes";
import emailTemplateRoutes from "./routes/emailTemplate.routes";
import agentScoringRoutes from "./routes/agentScoring.routes";
import slaAnalyticsRoutes from "./routes/slaAnalytics.routes";
import systemSettingsRoutes from "./routes/systemSettings.routes";

/* Middlewares */
import { errorHandler } from "./middlewares/error.middleware";
import { notFoundHandler } from "./middlewares/notFound.middleware";

const app: Application = express();

const API_PREFIX = env.app.apiPrefix;
const isProd = env.app.env === "production";

/* -------------------------------------------------------------------------- */
/* SECURITY                                                                   */
/* -------------------------------------------------------------------------- */

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

/* -------------------------------------------------------------------------- */
/* CORS                                                                       */
/* -------------------------------------------------------------------------- */

app.use(
  cors({
    origin: env.app.clientUrl,
    credentials: true,
  }),
);

/* -------------------------------------------------------------------------- */
/* RATE LIMIT                                                                 */
/* -------------------------------------------------------------------------- */

app.use(
  rateLimit({
    windowMs: env.security.rateLimitWindowMs,
    max: env.security.rateLimitMaxRequests,
  }),
);

/* -------------------------------------------------------------------------- */
/* BODY PARSER                                                               */
/* -------------------------------------------------------------------------- */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* -------------------------------------------------------------------------- */
/* COMPRESSION                                                               */
/* -------------------------------------------------------------------------- */

app.use(compression());

/* -------------------------------------------------------------------------- */
/* LOGGING                                                                   */
/* -------------------------------------------------------------------------- */

if (env.features.enableMorgan) {
  app.use(morgan(isProd ? "combined" : "dev"));
}

/* -------------------------------------------------------------------------- */
/* ROUTES                                                                    */
/* -------------------------------------------------------------------------- */

app.use(`${API_PREFIX}/health`, healthRoutes);

/* Render (and most PaaS) ping "/" by default for platform health checks,
   separate from our versioned /api/v1/health. Without this every ping
   was logged as a 404 ROUTE_NOT_FOUND warning. */
app.get("/", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/tickets`, ticketRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/customers`, customerRoutes);
app.use(`${API_PREFIX}/teams`, teamRoutes);
app.use(`${API_PREFIX}/automation`, automationRoutes);
app.use(`${API_PREFIX}/sla`, slaRoutes);
app.use(`${API_PREFIX}/reports`, reportsRoutes);
app.use(`${API_PREFIX}/knowledge-base`, knowledgeBaseRoutes);
app.use(`${API_PREFIX}/email-templates`, emailTemplateRoutes);
app.use(`${API_PREFIX}/agent-scoring`, agentScoringRoutes);
app.use(`${API_PREFIX}/sla-analytics`, slaAnalyticsRoutes);
app.use(`${API_PREFIX}/system-settings`, systemSettingsRoutes);

/* -------------------------------------------------------------------------- */
/* 404 HANDLER                                                               */
/* -------------------------------------------------------------------------- */

app.use(notFoundHandler);

/* -------------------------------------------------------------------------- */
/* GLOBAL ERROR HANDLER                                                      */
/* -------------------------------------------------------------------------- */

app.use(errorHandler);

export default app;