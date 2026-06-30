
import type { Request } from "express";
import type { DashboardDataOptions } from "../services/dashboard.service";

/**
 * Parses the period/days query params shared by the dashboard and
 * analytics-dashboard endpoints into DashboardDataOptions.
 *
 * Accepts either:
 *   ?period=1d | 7d | 30d | full
 *   ?days=<n>   (custom range in days, any positive integer)
 *
 * `days` takes precedence over `period` if both are present. Returns {}
 * (the service's own 30-day default) if neither is given or unparseable.
 */
export function parsePeriodOptions(
  query: Request["query"],
): DashboardDataOptions {
  const rawDays = query.days;
  if (typeof rawDays === "string" && rawDays.trim()) {
    const n = Number(rawDays);
    if (Number.isFinite(n) && n > 0) {
      return { days: Math.floor(n) };
    }
  }

  const period = typeof query.period === "string" ? query.period : undefined;

  switch (period) {
    case "full":
      return { full: true };
    case "1d":
      return { days: 1 };
    case "7d":
      return { days: 7 };
    case "30d":
      return { days: 30 };
    default:
      return {};
  }
}
