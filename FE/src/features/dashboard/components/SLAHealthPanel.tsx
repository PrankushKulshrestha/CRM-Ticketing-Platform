
import React, { useMemo } from "react";

import {
  Activity,
  CircleAlert,
  CircleCheckBig,
  TriangleAlert,
} from "lucide-react";

import type { DashboardMetrics } from "../types/dashboard.types";

interface Props {
  metrics: DashboardMetrics;
}

interface HealthState {
  label: string;
  description: string;
  tone: string;
  score: number;
  icon: typeof CircleCheckBig;
}

function calculateHealthState(metrics: DashboardMetrics): HealthState {
  const totalTickets = Number(metrics.totalTickets) || 0;

  const openTickets = Number(metrics.openTickets) || 0;

  /*
   * FIX: previously recomputed compliance client-side as
   * (totalTickets - slaBreaches) / totalTickets, which is a different
   * (and weaker) formula than the backend's real slaCompliance — that one
   * is denominated against tickets that have actually closed (the only
   * ones that could have breached), via the real multi-level SLA tracker
   * in sla.service.ts. Using the same number Analytics now also receives
   * keeps both pages in agreement instead of each inventing its own.
   */
  const compliance =
    typeof metrics.slaCompliance === "number" ? metrics.slaCompliance : 100;

  const openRatio = totalTickets ? openTickets / totalTickets : 0;

  const score = Math.max(0, Math.min(100, compliance - openRatio * 20));

  if (compliance >= 98 && openRatio <= 0.3) {
    return {
      label: "Operational",
      description: "All systems operating within expected thresholds.",
      tone: "border-green-500/20 bg-green-500/10 text-green-600",
      icon: CircleCheckBig,
      score,
    };
  }

  if (compliance >= 90 && openRatio <= 0.5) {
    return {
      label: "Monitoring",
      description: "Operations remain stable but require observation.",
      tone: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600",
      icon: TriangleAlert,
      score,
    };
  }

  return {
    label: "Attention Required",
    description: "Backlog growth or SLA violations require intervention.",
    tone: "border-red-500/20 bg-red-500/10 text-red-600",
    icon: CircleAlert,
    score,
  };
}

export default function SLAHealthPanel({ metrics }: Props): React.ReactElement {
  const state = useMemo(() => calculateHealthState(metrics), [metrics]);

  const HealthIcon = state.icon;

  const avgResolutionTime = Number(metrics.avgResolutionTime) || 0;

  return (
    <div className="dashboard-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">System Health</h3>

        <p className="text-sm text-muted-foreground">
          High-level operational status
        </p>
      </div>

      <div className={`rounded-2xl border p-4 ${state.tone}`}>
        <div className="flex items-start gap-3">
          <HealthIcon className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0">
            <p className="font-medium">{state.label}</p>

            <p className="mt-1 text-sm opacity-90">{state.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">Open</p>

          <p className="mt-1 text-lg font-semibold">
            {metrics.openTickets ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">Resolved</p>

          <p className="mt-1 text-lg font-semibold">
            {metrics.resolvedToday ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">SLA Breaches</p>

          <p className="mt-1 text-lg font-semibold">
            {metrics.slaBreaches ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/60 bg-background/50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Health Score</span>

          <span className="font-semibold">{Math.round(state.score)}%</span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${state.score}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="h-3.5 w-3.5" />

        <span>Avg resolution time: {avgResolutionTime.toFixed(2)}h</span>
      </div>
    </div>
  );
}