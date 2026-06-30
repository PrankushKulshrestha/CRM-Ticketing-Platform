
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import type { ReactNode } from "react";

import { TrendingUp, TrendingDown } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                     */
/* -------------------------------------------------------------------------- */

export type TimeSeriesPoint = {
  date: string;
  tickets: number;
};

export type CategoryPoint = {
  name: string;
  value: number;
};

export type VolumeOverviewProps = {
  kpis: {
    created: number;
    resolved: number;
    avgResolution: string;
    csat: string;
  };
  dailyVolume: TimeSeriesPoint[];
  sources: CategoryPoint[];
  tiers: CategoryPoint[];
  priority: CategoryPoint[];
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                 */
/* -------------------------------------------------------------------------- */

const COLORS = {
  primary: "#6366f1",
  blue: "#3b82f6",
  green: "#10b981",
  orange: "#f59e0b",
  red: "#ef4444",
};

const SOURCE_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b"];

const formatK = (v: number) => `${(v / 1000).toFixed(0)}k`;

const tooltipStyle = {
  borderRadius: 12,
  fontSize: 11,
  border: "1px solid var(--border)",
  background: "var(--card)",
};

/* -------------------------------------------------------------------------- */
/* KPI CARD                                                                  */
/* -------------------------------------------------------------------------- */

function KpiCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string | number;
  trend?: string;
}) {
  const isPositive = trend?.startsWith("+");

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>

      <p className="text-3xl font-bold">{value}</p>

      {trend && (
        <div
          className={`mt-2 flex items-center gap-1 text-xs font-medium ${
            isPositive ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                            */
/* -------------------------------------------------------------------------- */

export default function VolumeOverview({
  kpis,
  dailyVolume,
  sources,
  tiers,
  priority,
}: VolumeOverviewProps) {
  const safeSources = sources ?? [];
  const safeTiers = tiers ?? [];
  const safePriority = priority ?? [];
  const safeDaily = dailyVolume ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Tickets Created" value={kpis.created} />
        <KpiCard label="Resolved" value={kpis.resolved} />
        <KpiCard label="Avg Resolution" value={kpis.avgResolution} />
        <KpiCard label="CSAT" value={kpis.csat} />
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <p className="text-sm font-semibold mb-4">Daily Ticket Volume</p>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={safeDaily}>
              <CartesianGrid vertical={false} opacity={0.06} />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatK} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                dataKey="tickets"
                stroke={COLORS.primary}
                fill={`${COLORS.primary}22`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <ChartCard title="Source">
          <BarChart data={safeSources} layout="vertical">
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip contentStyle={tooltipStyle} />

            <Bar dataKey="value">
              {safeSources.map((_, i) => (
                <Cell
                  key={i}
                  fill={SOURCE_COLORS[i % SOURCE_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Tier">
          <BarChart data={safeTiers}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip contentStyle={tooltipStyle} />

            <Bar dataKey="value">
              {safeTiers.map((_, i) => (
                <Cell key={i} fill={["#6366f1", "#06b6d4", "#10b981"][i % 3]} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Priority">
          <PieChart>
            <Pie data={safePriority} dataKey="value" innerRadius={55}>
              {safePriority.map((_, i) => (
                <Cell
                  key={i}
                  fill={["#6366f1", "#3b82f6", "#f59e0b", "#ef4444"][i % 4]}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
          </PieChart>
        </ChartCard>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* REUSABLE CHART WRAPPER                                                    */
/* -------------------------------------------------------------------------- */

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm font-semibold mb-4">{title}</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>
    </div>
  );
}