import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAgentPerformanceById } from "../hooks/useAnalytics";
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle,
  Star, RefreshCw, UserCircle, Ticket, ArrowLeft,
} from "lucide-react";

function fmt(n: number | null | undefined, unit: string, decimals = 1) {
  if (n == null) return "—";
  return `${Number(n.toFixed(decimals))}${unit}`;
}

function KpiCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  accent?: "success" | "warning" | "danger";
}) {
  const cls = accent === "success" ? "text-emerald-600"
    : accent === "warning" ? "text-amber-500"
    : accent === "danger"  ? "text-red-500" : "";
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 flex items-start gap-3">
      <div className="mt-0.5 rounded-xl bg-muted p-2 text-muted-foreground shrink-0"><Icon size={15} /></div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold leading-tight ${cls}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Bar({ value, label }: { value: number; label: string }) {
  const color = value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";
  const text  = value >= 80 ? "text-emerald-600" : value >= 50 ? "text-amber-500" : "text-red-500";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${text}`}>{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

const statusColor: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-600",
  pending: "bg-amber-500/15 text-amber-600",
  resolved: "bg-emerald-500/15 text-emerald-600",
  closed: "bg-slate-500/15 text-slate-500",
};

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: agent, isLoading, isError } = useAgentPerformanceById(id);

  const total    = agent?.totalTickets ?? 0;
  const resolved = agent?.resolvedTickets ?? 0;
  const resRate  = total > 0 ? Math.round((resolved / total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground animate-pulse">
        Loading agent data…
      </div>
    );
  }

  if (isError || !agent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <UserCircle size={40} strokeWidth={1} />
        <p className="text-sm font-medium">Agent not found</p>
        <button onClick={() => navigate(-1)} className="text-xs text-primary underline">Go back</button>
      </div>
    );
  }

  const recentTickets = (agent.recentTickets ?? []) as Array<{
    tkt_number: string; email_subject?: string; tkt_status: string;
  }>;

  return (
    <div className="space-y-5 p-3 sm:p-6">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} /> Back to leaderboard
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2 sm:text-2xl">
          <UserCircle size={20} className="text-muted-foreground shrink-0" />
          {agent.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">
          {agent.role} · {agent.email}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={TrendingUp}   label="Total Assigned" value={total} />
        <KpiCard icon={CheckCircle2} label="Resolved"       value={resolved} accent="success" />
        <KpiCard icon={Clock}        label="Open + Pending"
          value={agent.openTickets + agent.pendingTickets}
          accent={(agent.openTickets + agent.pendingTickets) > 10 ? "warning" : undefined} />
        <KpiCard icon={AlertTriangle} label="SLA Breaches" value={agent.slaBreaches}
          accent={agent.slaBreaches > 0 ? "danger" : "success"}
          sub={agent.slaBreaches === 0 ? "All within SLA ✓" : undefined} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Resolution Overview</h3>
          <Bar value={resRate} label="Resolution rate" />
          {agent.fcrRate != null && <Bar value={agent.fcrRate} label="First Contact Resolution (FCR)" />}
          <div className="grid grid-cols-3 gap-3 pt-1 text-center">
            <div><p className="text-lg font-bold">{total}</p><p className="text-xs text-muted-foreground">Total</p></div>
            <div><p className="text-lg font-bold text-emerald-600">{resolved}</p><p className="text-xs text-muted-foreground">Resolved</p></div>
            <div><p className="text-lg font-bold text-amber-500">{agent.openTickets + agent.pendingTickets}</p><p className="text-xs text-muted-foreground">Active</p></div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Speed & Satisfaction</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold">{fmt(agent.avgResponseMinutes, "m")}</p>
              <p className="text-xs text-muted-foreground mt-1">Avg First Response</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold">{fmt(agent.avgResolutionHours, "h")}</p>
              <p className="text-xs text-muted-foreground mt-1">Avg Resolution</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-center col-span-2">
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                {agent.csatAvg != null ? (
                  <><Star size={18} className="text-amber-400 fill-amber-400" />{agent.csatAvg.toFixed(1)}<span className="text-sm text-muted-foreground font-normal">/ 5</span></>
                ) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Customer Satisfaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent tickets */}
      {recentTickets.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
            <Ticket size={14} className="text-muted-foreground" />
            <span className="text-sm font-semibold">Recent Tickets</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/40">
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Number</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Subject</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((t) => (
                <tr key={t.tkt_number} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{t.tkt_number}</td>
                  <td className="px-4 py-2.5 max-w-xs truncate text-muted-foreground">{t.email_subject ?? "—"}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[t.tkt_status] ?? "bg-muted text-muted-foreground"}`}>
                      {t.tkt_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><RefreshCw size={10} /> FCR = First Contact Resolution</span>
        <span className="flex items-center gap-1"><Star size={10} /> CSAT = Customer Satisfaction avg (1–5)</span>
      </div>
    </div>
  );
}
