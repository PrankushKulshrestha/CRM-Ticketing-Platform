
// fe/src/features/dashboard/pages/DashboardPage.tsx
import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Inbox,
  Ticket,
} from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/layout/PageHeader";
import { useDashboard } from "../hooks/useDashboard";
import type {
  AgentPerformance,
  DistributionData,
  DashboardPeriodOptions,
} from "../types/dashboard.types";
import ActivityFeed from "../components/ActivityFeed";
import SLAHealthPanel from "../components/SLAHealthPanel";
import TicketTrendChart from "../components/TicketTrendChart";
import { OpenTicketsWidget } from "../widgets/OpenTicketsWidget";
import BacklogWidget from "@/features/tickets/components/BacklogWidget";
import ResponseTimeChart from "@/features/analytics/components/ResponseTimeChart";
import { useResponseTimeAnalytics } from "@/features/analytics/hooks/useAnalytics";

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 h-4 w-24 rounded bg-muted" />
      <div className="h-8 w-16 rounded bg-muted" />
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Color mapping — per UI/UX color brief
 * ---------------------------------------------------------------------- */

// Status: semantic (green = resolved/closed, warning = pending, neutral/info = open)
const STATUS_COLOR_MAP: Record<string, string> = {
  new: "var(--info)",
  open: "var(--info)",
  pending: "var(--warning)",
  reopened: "hsl(25 95% 55%)",
  request_clarification: "hsl(270 70% 60%)",
  in_progress: "var(--info)",
  on_going: "var(--info)",
  ongoing: "var(--info)",
  resolved: "var(--success)",
  closed: "var(--success)",
  "removed/resolved": "var(--success)",
  removed: "var(--success)",
  unknown: "var(--neutral)",
};

// Categorical: cycles through cat-1..6 per the brief's Palette A
const CATEGORICAL_PALETTE = [
  "var(--cat-1)",
  "var(--cat-2)",
  "var(--cat-3)",
  "var(--cat-4)",
  "var(--cat-5)",
  "var(--cat-6)",
];

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * Resolve a bar color for a distribution item.
 * Status-like labels get semantic colors; everything else
 * (categories, subcategories, sources) cycles through the
 * categorical palette by index for visual consistency.
 */
function getDistributionColor(
  label: string,
  index: number,
  isStatus: boolean,
): string {
  if (isStatus) {
    const normalized = normalizeLabel(label);
    if (STATUS_COLOR_MAP[normalized]) {
      return STATUS_COLOR_MAP[normalized];
    }
  }
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length];
}

function DistributionCard({
  title,
  description,
  items,
  isStatus = false,
}: {
  title: string;
  description: string;
  items: DistributionData[];
  isStatus?: boolean;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="dashboard-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
          No data available.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const percent =
              total > 0 ? Math.round((item.value / total) * 100) : 0;
            const color = getDistributionColor(item._id, index, isStatus);
            return (
              <div key={item._id} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {item._id}
                  </span>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AgentPerformanceCard({ items }: { items: AgentPerformance[] }) {
  return (
    <div className="dashboard-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Agent Performance</h3>
        <p className="text-sm text-muted-foreground">
          Ticket resolution and pending load
        </p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
          No agent performance data available.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Resolved</th>
                <th className="px-4 py-3">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((row) => (
                <tr key={row._id}>
                  <td className="px-4 py-3 font-medium">{row._id}</td>
                  <td className="px-4 py-3">{row.totalTickets}</td>
                  <td className="px-4 py-3 font-medium text-success">
                    {row.resolvedTickets}
                  </td>
                  <td className="px-4 py-3 font-medium text-warning">
                    {row.pendingTickets}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriodOptions>({
    period: "30d",
  });
  const { data, isLoading, isError, error, isFetching } = useDashboard(period);
  const {
    data: responseTimeData,
    isLoading: isResponseTimeLoading,
    isError: isResponseTimeError,
  } = useResponseTimeAnalytics(6);

  const metrics = data?.metrics ?? {
    totalTickets: 0,
    openTickets: 0,
    resolvedToday: 0,
    slaBreaches: 0,
    avgResolutionTime: 0,
    slaCompliance: 0,
    customerSatisfaction: 0,
  };
  // Keep previous charts value while new period is loading — prevents blank-out
  const chartsRef = React.useRef(data?.charts ?? null);
  if (data?.charts) chartsRef.current = data.charts;
  const charts = data?.charts ?? chartsRef.current;
  const activity = data?.activity ?? [];

  const summaryCards = useMemo(() => {
    const totalTickets = metrics.totalTickets;

    const openShare =
      totalTickets > 0
        ? Math.round((metrics.openTickets / totalTickets) * 100)
        : 0;

    const compliance =
      totalTickets > 0
        ? Number(
            (
              ((totalTickets - metrics.slaBreaches) / totalTickets) *
              100
            ).toFixed(2),
          )
        : 100;

    return [
      {
        title: "Total Tickets",
        value: totalTickets,
        icon: Ticket,
        trend: "All-time workload",
      },
      {
        title: "Open Tickets",
        value: metrics.openTickets,
        icon: Inbox,
        trend: `${openShare}% of total`,
      },
      {
        title: "Resolved Today",
        value: metrics.resolvedToday,
        icon: CheckCircle,
        trend: "Closed today",
      },
      {
        title: "SLA Breaches",
        value: metrics.slaBreaches,
        icon: AlertTriangle,
        trend: compliance === 100 ? "No breaches detected" : "Needs review",
      },
      {
        title: "Avg Resolution Time",
        value: `${metrics.avgResolutionTime}h`,
        icon: Clock,
        trend: "Average from closed tickets",
      },
      {
        title: "Compliance Score",
        value: `${compliance}%`,
        icon: BarChart3,
        trend: "Derived from SLA breaches",
      },
    ];
  }, [metrics]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Live overview of your support operations"
      />

      {isError && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          Failed to load dashboard data: {error?.message ?? "Unknown error"}
        </div>
      )}

      {/* Top row: KPI summary cards + open tickets + system health */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))
              : summaryCards.map((card) => (
                  <StatCard
                    key={card.title}
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    trend={card.trend}
                  />
                ))}
          </div>
        </div>

        <div className="space-y-6">
          <OpenTicketsWidget count={metrics?.openTickets ?? 0} />
        </div>
      </div>

      {/* Ticket trends — full width */}
      <div className="min-w-0">
        <TicketTrendChart
          data={charts?.trends ?? []}
          period={period}
          onPeriodChange={setPeriod}
          isLoading={isFetching && !charts}
        />
      </div>

      {/* First Response Time / First Contact Resolution — full width */}
      <div className="min-w-0">
        {isResponseTimeError ? (
          <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            Failed to load response time analytics.
          </div>
        ) : (
          <ResponseTimeChart
            months={responseTimeData?.months}
            isLoading={isResponseTimeLoading}
          />
        )}
      </div>

      {metrics && <SLAHealthPanel metrics={metrics} />}
      {/* Backlog overview — agents see their own; managers see all */}
      <BacklogWidget />
      {/* Activity feed*/}
      <ActivityFeed activities={activity} />
      {/* status distribution */}
      <div className="grid gap-6 xl:grid-cols-2">
        <DistributionCard
          title="Status Distribution"
          description="How tickets are currently distributed by status"
          items={charts?.statusDistribution ?? []}
          isStatus
        />
      </div>

      {/* Category distribution + agent performance */}
      <div className="grid gap-6 xl:grid-cols-2">
        <DistributionCard
          title="Category Distribution"
          description="Ticket volume by category"
          items={charts?.categoryDistribution ?? []}
        />
        <AgentPerformanceCard items={charts?.agentPerformance ?? []} />
      </div>

      {/* Subcategory distribution + operational snapshot */}
      <div className="grid gap-6 xl:grid-cols-2">
        <DistributionCard
          title="Subcategory Distribution"
          description="Detailed ticket classification breakdown"
          items={charts?.subCategoryDistribution ?? []}
        />
        <SectionCard
          title="Operational Snapshot"
          description="Quick metrics derived from the current ticket queue"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <p className="text-xs text-muted-foreground">Total tickets</p>
              <p className="mt-1 text-2xl font-bold">
                {metrics?.totalTickets ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <p className="text-xs text-muted-foreground">Resolved today</p>
              <p className="mt-1 text-2xl font-bold">
                {metrics?.resolvedToday ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <p className="text-xs text-muted-foreground">SLA breaches</p>
              <p className="mt-1 text-2xl font-bold">
                {metrics?.slaBreaches ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <p className="text-xs text-muted-foreground">
                Avg resolution time
              </p>
              <p className="mt-1 text-2xl font-bold">
                {metrics ? `${metrics.avgResolutionTime}h` : "—"}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}