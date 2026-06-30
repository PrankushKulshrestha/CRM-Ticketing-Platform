
import React from "react";
import {
  Activity,
  CircleCheckBig,
  TriangleAlert,
} from "lucide-react";

import type {
  DashboardMetrics,
} from "../types/dashboard.types";

interface Props {
  metrics: DashboardMetrics;
}

function toNumber(
  value: unknown,
  fallback = 0,
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function getHealthState(
  metrics: DashboardMetrics,
) {
  const totalTickets = toNumber(
    metrics.totalTickets,
  );

  const openTickets = toNumber(
    metrics.openTickets,
  );

  const slaBreaches = toNumber(
    metrics.slaBreaches,
  );

  const openRatio =
    totalTickets > 0
      ? openTickets / totalTickets
      : 0;

  const breachRatio =
    totalTickets > 0
      ? slaBreaches / totalTickets
      : 0;

  if (
    slaBreaches === 0 &&
    openRatio <= 0.35
  ) {
    return {
      label: "Operational",
      description:
        "Ticket volume and SLA performance are within a healthy range.",
      tone:
        "border-green-500/20 bg-green-500/10 text-green-600",
      icon: CircleCheckBig,
    };
  }

  if (
    breachRatio <= 0.05 &&
    openRatio <= 0.55
  ) {
    return {
      label: "Monitoring",
      description:
        "The queue remains manageable, but trends should be monitored.",
      tone:
        "border-yellow-500/20 bg-yellow-500/10 text-yellow-600",
      icon: TriangleAlert,
    };
  }

  return {
    label: "Attention Required",
    description:
      "Backlog growth or SLA violations require active intervention.",
    tone:
      "border-red-500/20 bg-red-500/10 text-red-600",
    icon: TriangleAlert,
  };
}

export function SystemHealthCard({
  metrics,
}: Props): React.ReactElement {
  const state =
    getHealthState(metrics);

  const HealthIcon =
    state.icon;

  const openTickets =
    toNumber(metrics.openTickets);

  const resolvedToday =
    toNumber(metrics.resolvedToday);

  const slaBreaches =
    toNumber(metrics.slaBreaches);

  const avgResolutionTime =
    toNumber(
      metrics.avgResolutionTime,
    );

  return (
    <div className="dashboard-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">
          System Health
        </h3>

        <p className="text-sm text-muted-foreground">
          High-level operational status
        </p>
      </div>

      <div
        className={`rounded-2xl border p-4 ${state.tone}`}
      >
        <div className="flex items-start gap-3">
          <HealthIcon className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="text-sm font-semibold">
              {state.label}
            </p>

            <p className="mt-1 text-sm opacity-90">
              {state.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">
            Open
          </p>

          <p className="mt-1 text-lg font-semibold">
            {openTickets}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">
            Resolved
          </p>

          <p className="mt-1 text-lg font-semibold">
            {resolvedToday}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">
            SLA Breaches
          </p>

          <p className="mt-1 text-lg font-semibold">
            {slaBreaches}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="h-3.5 w-3.5" />

        <span>
          Avg resolution time:{" "}
          {avgResolutionTime.toFixed(
            1,
          )}
          h
        </span>
      </div>
    </div>
  );
}

export default SystemHealthCard;