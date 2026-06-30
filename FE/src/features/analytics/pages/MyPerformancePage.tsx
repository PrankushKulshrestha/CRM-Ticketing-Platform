import React from "react";
import { useAgentPerformanceById } from "../hooks/useAnalytics";
import { useAuth } from "@/app/providers/AuthProvider";
import { TICKET_STATUS_COLOR } from "@/lib/utils";
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle,
  Star, RefreshCw, UserCircle, Ticket,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function fmt(n: number | null | undefined, unit: string, decimals = 1) {
  if (n == null) return "—";
  return `${Number(n.toFixed(decimals))}${unit}`;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "success" | "warning" | "danger";
}) {
  const cls =
    accent === "success" ? "text-emerald-600"
    : accent === "warning" ? "text-amber-500"
    : accent === "danger" ? "text-red-500"
    : "";

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 flex items-start gap-3">
      <div className="mt-0.5 rounded-xl bg-muted p-2 text-muted-foreground">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold leading-tight ${cls}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Bar({ value, label }: { value: number; label: string }) {
  const color =
    value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";
  const text =
    value >= 80 ? "text-emerald-600" : value >= 50 ? "text-amber-500" : "text-red-500";
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

/* -------------------------------------------------------------------------- */
/* Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function MyPerformancePage() {
  const { user } = useAuth();
  const { data: me, isLoading, isError } = useAgentPerformanceById(user?.userId);

  const total = me?.totalTickets ?? 0;
  const resolved = me?.resolvedTickets ?? 0;
  const resRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground animate-pulse">
        Loading your performance…
      </div>
    );
  }

  if (isError || !me) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <UserCircle size={40} strokeWidth={1} />
        <p className="text-sm font-medium">No ticket data found for your account</p>
        <p className="text-xs">Stats appear once you have been assigned tickets.</p>
      </div>
    );
  }

  const recentTickets = (me.recentTickets ?? []) as Array<{
    tkt_number: string;
    email_subject?: string;
    tkt_status: string;
    color_code?: number;
    created_date?: string;
  }>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCircle size={22} className="text-muted-foreground" />
          My Performance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {me.name} · {me.role} · {me.email}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={TrendingUp} label="Total Assigned" value={total} />
        <KpiCard icon={CheckCircle2} label="Resolved" value={resolved} accent="success" />
        <KpiCard
          icon={Clock}
          label="Open + Pending"
          value={me.openTickets + me.pendingTickets}
          accent={(me.openTickets + me.pendingTickets) > 10 ? "warning" : undefined}
        />
        <KpiCard
          icon={AlertTriangle}
          label="SLA Breaches"
          value={me.slaBreaches}
          accent={me.slaBreaches > 0 ? "danger" : "success"}
          sub={me.slaBreaches === 0 ? "All within SLA ✓" : undefined}
        />
      </div>

      {/* Metrics panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resolution */}
        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Resolution Overview</h3>
          <Bar value={resRate} label="Resolution rate" />
          {me.fcrRate != null && (
            <Bar value={me.fcrRate} label="First Contact Resolution (FCR)" />
          )}
          <div className="grid grid-cols-3 gap-3 pt-1 text-center">
            <div>
              <p className="text-lg font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{resolved}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-500">
                {me.openTickets + me.pendingTickets}
              </p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </div>

        {/* Speed + satisfaction */}
        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Speed & Satisfaction</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold">
                {fmt(me.avgResponseMinutes, "m")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Avg First Response</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold">
                {fmt(me.avgResolutionHours, "h")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Avg Resolution Time</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-center col-span-2">
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                {me.csatAvg != null ? (
                  <>
                    <Star size={18} className="text-amber-400 fill-amber-400" />
                    {me.csatAvg.toFixed(1)}
                    <span className="text-sm text-muted-foreground font-normal">/ 5</span>
                  </>
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
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {t.tkt_number}
                  </td>
                  <td className="px-4 py-2.5 max-w-xs truncate text-muted-foreground">
                    {t.email_subject ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TICKET_STATUS_COLOR[t.tkt_status] ?? "bg-muted text-muted-foreground"}`}>
                      {t.tkt_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><RefreshCw size={11} /> FCR = First Contact Resolution</span>
        <span className="flex items-center gap-1"><Star size={11} /> CSAT = Customer Satisfaction avg (1–5)</span>
      </div>
    </div>
  );
}
