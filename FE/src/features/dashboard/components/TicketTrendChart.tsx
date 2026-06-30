
import React, { useCallback, useId, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import type {
  TrendData,
  DashboardPeriodPreset,
  DashboardPeriodOptions,
} from "../types/dashboard.types";

interface Props {
  data?: TrendData[];
  /** Currently selected period — owned by the parent so it can refetch. */
  period?: DashboardPeriodOptions;
  /** Called when the user picks a different preset or custom day count. */
  onPeriodChange?: (next: DashboardPeriodOptions) => void;
  isLoading?: boolean;
}

interface ChartPoint {
  date: string;
  created: number;
  resolved: number;
  closed: number;
  open: number;
}

function formatDateLabel(value: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

/* -------------------------------------------------------------------------- */
/* Series config — one place to add/remove/reorder lines                     */
/* -------------------------------------------------------------------------- */

const SERIES = [
  { key: "created", label: "Total (Created)", color: "var(--chart-1)" },
  { key: "resolved", label: "Resolved", color: "var(--success)" },
  { key: "closed", label: "Closed", color: "var(--chart-2)" },
  { key: "open", label: "Open (EOD)", color: "var(--warning)" },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

/* -------------------------------------------------------------------------- */
/* Period presets                                                            */
/* -------------------------------------------------------------------------- */

const PERIOD_PRESETS: { value: DashboardPeriodPreset | "custom"; label: string }[] = [
  { value: "1d", label: "1 Day" },
  { value: "7d", label: "1 Week" },
  { value: "30d", label: "1 Month" },
  { value: "full", label: "Full" },
  { value: "custom", label: "Custom" },
];

function presetFromOptions(
  options?: DashboardPeriodOptions,
): DashboardPeriodPreset | "custom" {
  if (!options || (!options.period && !options.days)) return "30d";
  if (options.days) return "custom";
  return options.period ?? "30d";
}

/* -------------------------------------------------------------------------- */
/* Single-series mini chart, used in split view                              */
/* -------------------------------------------------------------------------- */

function MiniTrendChart({
  data,
  seriesKey,
  label,
  color,
  total,
}: {
  data: ChartPoint[];
  seriesKey: SeriesKey;
  label: string;
  color: string;
  total: number;
}) {
  const gradientId = useId();

  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h4 className="text-sm font-semibold">{label}</h4>
        </div>
        <span className="text-sm font-bold">{total}</span>
      </div>
      <div className="h-40 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDateLabel(String(value))}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              formatter={(value) => [Number(value ?? 0), label]}
              labelFormatter={(l) => formatDateLabel(String(l ?? ""))}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid var(--border)",
                background: "var(--card)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              }}
            />
            <Area
              type="monotone"
              dataKey={seriesKey}
              name={label}
              stroke={color}
              fill={`url(#${gradientId})`}
              strokeWidth={2}
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                            */
/* -------------------------------------------------------------------------- */

export default function TicketTrendChart({
  data = [],
  period,
  onPeriodChange,
  isLoading = false,
}: Props): React.ReactElement {
  const gradientIdBase = useId();
  const observerRef = useRef<ResizeObserver | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [view, setView] = useState<"combined" | "split">("combined");

  const selectedPreset = presetFromOptions(period);
  const [customDays, setCustomDays] = useState<string>(
    period?.days ? String(period.days) : "30",
  );

  const chartData = useMemo<ChartPoint[]>(
    () =>
      data.map((item) => ({
        date: String(item?._id ?? ""),
        created: Number(item?.count ?? 0),
        resolved: Number(item?.resolvedCount ?? 0),
        closed: Number(item?.closedCount ?? 0),
        open: Number(item?.openCount ?? 0),
      })),
    [data],
  );

  const totals = useMemo(
    () => ({
      created: chartData.reduce((sum, item) => sum + item.created, 0),
      resolved: chartData.reduce((sum, item) => sum + item.resolved, 0),
      closed: chartData.reduce((sum, item) => sum + item.closed, 0),
      open: chartData.length > 0 ? chartData[chartData.length - 1].open : 0,
    }),
    [chartData],
  );

  const peakTickets = useMemo(
    () => Math.max(...chartData.map((item) => item.created), 0),
    [chartData],
  );

  // Callback ref — fires whenever the combined-view div mounts/unmounts,
  // so isReady is set even when the div first renders after data loads.
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
    if (!el) return;
    if (el.offsetWidth > 0) { setIsReady(true); return; }
    const ro = new ResizeObserver((entries) => {
      if (entries[0]?.contentRect.width > 0) { setIsReady(true); ro.disconnect(); }
    });
    ro.observe(el);
    observerRef.current = ro;
  }, []);

  const handlePresetChange = (value: string) => {
    if (!onPeriodChange) return;

    if (value === "custom") {
      const n = Number(customDays);
      onPeriodChange({ days: Number.isFinite(n) && n > 0 ? Math.floor(n) : 30 });
      return;
    }

    onPeriodChange({ period: value as DashboardPeriodPreset });
  };

  const handleCustomDaysCommit = () => {
    if (!onPeriodChange) return;
    const n = Number(customDays);
    if (Number.isFinite(n) && n > 0) {
      onPeriodChange({ days: Math.floor(n) });
    }
  };

  return (
    <div className="dashboard-card p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Ticket Trends</h3>
          <p className="text-sm text-muted-foreground">
            Volume — created, resolved, closed, and open as of end of day
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Created</p>
          <p className="text-xl font-bold">{totals.created}</p>
          <p className="text-xs text-muted-foreground">
            Peak: {peakTickets} · Open now: {totals.open}
          </p>
        </div>
      </div>

      {/* Controls: view toggle + period selector */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as "combined" | "split")}>
          <TabsList>
            <TabsTrigger value="combined">Combined</TabsTrigger>
            <TabsTrigger value="split">Split (4 graphs)</TabsTrigger>
          </TabsList>
        </Tabs>

        {onPeriodChange && (
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={selectedPreset} onValueChange={handlePresetChange}>
              <TabsList>
                {PERIOD_PRESETS.map((p) => (
                  <TabsTrigger key={p.value} value={p.value}>
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {selectedPreset === "custom" && (
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={1}
                  max={366}
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  onBlur={handleCustomDaysCommit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCustomDaysCommit();
                  }}
                  className="h-8 w-20 text-sm"
                  aria-label="Custom number of days"
                />
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-72 w-full min-w-0 animate-pulse items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
          Loading trends…
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-72 w-full min-w-0 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
          No trend data available.
        </div>
      ) : view === "combined" ? (
        <div ref={containerRef} className="h-72 w-full min-w-0">
          {isReady && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  {SERIES.map((s) => (
                    <linearGradient
                      key={s.key}
                      id={`${gradientIdBase}-${s.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid strokeDasharray="3 3" opacity={0.08} />

                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => formatDateLabel(String(value))}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value, name) => [Number(value ?? 0), name]}
                  labelFormatter={(label) =>
                    formatDateLabel(String(label ?? ""))
                  }
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                  }}
                />

                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                />

                {SERIES.map((s) => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    fill={`url(#${gradientIdBase}-${s.key})`}
                    strokeWidth={2.5}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SERIES.map((s) => (
            <MiniTrendChart
              key={s.key}
              data={chartData}
              seriesKey={s.key}
              label={s.label}
              color={s.color}
              total={totals[s.key]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
