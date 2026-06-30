
import { useState } from "react";
import {
  BarChart2,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Ticket,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import PageHeader from "@/components/layout/PageHeader";
import { useReport } from "../hooks/useReport";
import type { ReportPeriod } from "../types/report.types";

const PERIODS: { label: string; value: ReportPeriod }[] = [
  { label: "Last 7 days",  value: "7d"  },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("30d");

  const { data, isLoading, isError } = useReport({ period });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Operational summaries and support performance metrics."
        actions={
          <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p.value
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load report data. Please try again.
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          {
            icon: Ticket,
            label: "Total Tickets",
            value: data?.summary.totalTickets,
            color: "text-primary",
          },
          {
            icon: CheckCircle2,
            label: "Resolved",
            value: data?.summary.resolvedTickets,
            color: "text-green-600",
          },
          {
            icon: Clock,
            label: "Avg Resolution",
            value: data
              ? `${Number(data.summary.avgResolutionTimeHours).toFixed(1)}h`
              : undefined,
            color: "text-blue-600",
          },
          {
            icon: ShieldAlert,
            label: "SLA Breaches",
            value: data?.summary.slaBreaches,
            color: "text-red-600",
          },
          {
            icon: TrendingUp,
            label: "SLA Compliance",
            value: data ? `${data.summary.slaCompliancePercent}%` : undefined,
            color: "text-emerald-600",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className={`flex items-center gap-1.5 ${color}`}>
              <Icon className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">
              {isLoading ? "—" : (value ?? 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Top performers */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Top Category</p>
            <p className="mt-1 font-semibold">{data.summary.topCategory || "—"}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Top Agent</p>
            <p className="mt-1 font-semibold">{data.summary.topAgent || "—"}</p>
          </div>
        </div>
      )}

      {/* Trend chart */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Ticket Trends</h3>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Loading chart…
          </div>
        ) : (
          <div className="overflow-hidden" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart
                data={data?.trends ?? []}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.08} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    fontSize: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="Created"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#gradCreated)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#gradResolved)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}