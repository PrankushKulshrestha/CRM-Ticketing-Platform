import React from "react";
import { useNavigate } from "react-router-dom";
import { useAgentPerformance } from "../hooks/useAnalytics";
import type { AgentPerformanceSummary } from "../api/analyticsApi";
import {
  Users, CheckCircle2, AlertTriangle,
  Star, RefreshCw, TrendingUp, Zap,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function fmt(n: number | null | undefined, unit: string, decimals = 1) {
  if (n == null) return "—";
  return `${Number(n.toFixed(decimals))}${unit}`;
}

function pct(num: number, den: number) {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}

function Bar({ value, color = "bg-primary" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 flex items-start gap-3">
      <div className="mt-0.5 rounded-xl bg-muted p-2 text-muted-foreground shrink-0">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Per-agent row                                                             */
/* -------------------------------------------------------------------------- */

function AgentRow({
  a, rank, onClick,
}: {
  a: AgentPerformanceSummary;
  rank: number;
  onClick: () => void;
}) {
  const rate = pct(a.resolvedTickets, a.totalTickets);
  const rateColor =
    rate >= 80 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-red-500";
  const rateText =
    rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-amber-500" : "text-red-500";

  return (
    <tr
      className="border-b border-border/40 hover:bg-muted/40 transition-colors cursor-pointer"
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      aria-label={`View details for ${a.name}`}
    >
      {/* Rank */}
      <td className="px-3 py-3 text-sm text-muted-foreground w-8 text-center font-mono">
        {rank}
      </td>

      {/* Agent */}
      <td className="px-3 py-3">
        <p className="font-medium text-sm">{a.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{a.role}</p>
      </td>

      {/* Volume */}
      <td className="px-3 py-3 text-sm text-center">{a.totalTickets}</td>
      <td className="px-3 py-3 text-sm text-center text-emerald-600 font-medium">
        {a.resolvedTickets}
      </td>
      <td className="hidden md:table-cell px-3 py-3 text-sm text-center text-amber-500">
        {a.openTickets + a.pendingTickets}
      </td>

      {/* Resolution rate */}
      <td className="px-3 py-3 w-28">
        <div className="space-y-1">
          <span className={`text-xs font-semibold ${rateText}`}>{rate}%</span>
          <Bar value={rate} color={rateColor} />
        </div>
      </td>

      {/* Avg response — hide on small screens */}
      <td className="hidden lg:table-cell px-3 py-3 text-sm text-center text-muted-foreground">
        {fmt(a.avgResponseMinutes, "m")}
      </td>

      {/* SLA breaches */}
      <td className="px-3 py-3 text-sm text-center">
        {a.slaBreaches > 0 ? (
          <span className="inline-flex items-center gap-1 text-red-500 font-medium">
            <AlertTriangle size={12} />
            {a.slaBreaches}
          </span>
        ) : (
          <span className="text-emerald-600">✓</span>
        )}
      </td>

      {/* CSAT — hide on small screens */}
      <td className="hidden sm:table-cell px-3 py-3 text-sm text-center">
        {a.csatAvg != null ? (
          <span className="inline-flex items-center gap-1 font-medium">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            {a.csatAvg.toFixed(1)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AgentPerformancePage() {
  const navigate = useNavigate();
  const { data: agents = [], isLoading, isError } = useAgentPerformance();

  const totalTickets  = agents.reduce((s, a) => s + a.totalTickets, 0);
  const totalResolved = agents.reduce((s, a) => s + a.resolvedTickets, 0);
  const totalBreaches = agents.reduce((s, a) => s + a.slaBreaches, 0);
  const teamRate      = pct(totalResolved, totalTickets);

  const csatAgents = agents.filter((a) => a.csatAvg != null);
  const avgCsat =
    csatAgents.length > 0
      ? (csatAgents.reduce((s, a) => s + a.csatAvg!, 0) / csatAgents.length).toFixed(1)
      : "—";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground animate-pulse">
        Loading agent performance…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-red-500">
        Failed to load agent data.
      </div>
    );
  }

  return (
    <div className="space-y-5 p-3 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2 sm:text-2xl">
          <Users size={20} className="text-muted-foreground shrink-0" />
          Agent Performance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Team-wide helpdesk handling metrics
        </p>
      </div>

      {/* KPI strip — 2 cols on mobile, 4 on md */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={Users}        label="Active Agents"  value={agents.length} />
        <KpiCard icon={TrendingUp}   label="Total Tickets"  value={totalTickets} />
        <KpiCard
          icon={CheckCircle2}
          label="Resolved"
          value={totalResolved}
          sub={`${teamRate}% team rate`}
        />
        <KpiCard
          icon={AlertTriangle}
          label="SLA Breaches"
          value={totalBreaches}
          sub={totalBreaches === 0 ? "All within SLA" : undefined}
        />
      </div>

      {/* CSAT separately to avoid odd grid on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard icon={Star} label="Avg CSAT" value={avgCsat} sub="out of 5.0" />
      </div>

      {/* Table — horizontally scrollable on mobile */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
          <Zap size={14} className="text-muted-foreground" />
          <span className="text-sm font-semibold">Leaderboard</span>
          <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
            Click a row to view details · Sorted by resolved tickets
          </span>
          <span className="ml-auto text-xs text-muted-foreground sm:hidden">
            Tap to view details
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="border-b border-border/40 bg-muted/40">
                <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground w-8 text-center">#</th>
                <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">Agent</th>
                <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-center">Total</th>
                <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-center">Resolved</th>
                <th className="hidden md:table-cell px-3 py-2.5 text-xs font-medium text-muted-foreground text-center">Open</th>
                <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground w-28">Rate</th>
                <th className="hidden lg:table-cell px-3 py-2.5 text-xs font-medium text-muted-foreground text-center">Avg Response</th>
                <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-center">SLA</th>
                <th className="hidden sm:table-cell px-3 py-2.5 text-xs font-medium text-muted-foreground text-center">CSAT</th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No agent data yet. Assign tickets to agents to see performance.
                  </td>
                </tr>
              ) : (
                agents.map((a, i) => (
                  <AgentRow
                    key={a.agentId}
                    a={a}
                    rank={i + 1}
                    onClick={() => navigate(`/analytics/agents/${a.agentId}`)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><RefreshCw size={10} /> FCR = First Contact Resolution</span>
        <span className="flex items-center gap-1"><Star size={10} /> CSAT = Customer Satisfaction (1–5)</span>
        <span className="flex items-center gap-1"><AlertTriangle size={10} /> SLA = tickets where SLA was breached</span>
      </div>
    </div>
  );
}
