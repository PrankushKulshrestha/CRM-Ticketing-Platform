
import React, { useId, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { MonthlyResponsePoint } from "../types/analytics.types";

interface Props {
  months?: MonthlyResponsePoint[];
  isLoading?: boolean;
}

function formatMonthLabel(value: string): string {
  // value is "YYYY-MM"
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  const d = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "2-digit",
  }).format(d);
}

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function ResponseTimeChart({
  months = [],
  isLoading = false,
}: Props): React.ReactElement {
  const gradientIdBase = useId();

  const chartData = useMemo(
    () =>
      months.map((m) => ({
        month: m.month,
        label: formatMonthLabel(m.month),
        firstResponse: m.avgFirstResponseMinutes,
        firstResolution: m.avgFirstResolutionMinutes,
        fcrRate: m.fcrRate,
        frtSample: m.firstResponseSampleSize,
        fcrSample: m.firstResolutionSampleSize,
      })),
    [months],
  );

  const overallFrt = useMemo(() => {
    const withData = chartData.filter((d) => d.firstResponse !== null);
    if (withData.length === 0) return null;
    const totalSample = withData.reduce((s, d) => s + d.frtSample, 0);
    if (totalSample === 0) return null;
    const weighted = withData.reduce(
      (s, d) => s + (d.firstResponse ?? 0) * d.frtSample,
      0,
    );
    return weighted / totalSample;
  }, [chartData]);

  const overallFcrRate = useMemo(() => {
    const withData = chartData.filter((d) => d.fcrRate !== null);
    if (withData.length === 0) return null;
    return withData.reduce((s, d) => s + (d.fcrRate ?? 0), 0) / withData.length;
  }, [chartData]);

  return (
    <Card className="border border-border/50">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base font-semibold">
            First Response &amp; First Contact Resolution
          </CardTitle>
          <CardDescription>
            Monthly average time to first agent reply (FRT) and average
            resolution time for tickets solved on the first interaction (FCR)
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-4 text-right">
          <div>
            <p className="text-xs text-muted-foreground">Avg FRT</p>
            <p className="text-lg font-bold">{formatMinutes(overallFrt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">FCR Rate</p>
            <p className="text-lg font-bold">
              {overallFcrRate !== null ? `${overallFcrRate.toFixed(0)}%` : "—"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex h-72 w-full min-w-0 animate-pulse items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
            Loading response time data…
          </div>
        ) : chartData.every(
            (d) => d.firstResponse === null && d.firstResolution === null,
          ) ? (
          <div className="flex h-72 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border/70 bg-muted/20 text-center text-sm text-muted-foreground">
            <p>No response time data yet.</p>
            <p className="text-xs">
              FRT is recorded the first time an agent replies on a ticket.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id={`${gradientIdBase}-frt`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id={`${gradientIdBase}-fcr`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" opacity={0.08} />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Minutes",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "var(--muted-foreground)" },
                  }}
                />

                <Tooltip
                  formatter={(value, name) => [
                    formatMinutes(value === null ? null : Number(value)),
                    name,
                  ]}
                  labelFormatter={(label) => String(label)}
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

                <Bar
                  dataKey="firstResponse"
                  name="First Response Time"
                  fill={`url(#${gradientIdBase}-frt)`}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="firstResolution"
                  name="First Resolution Time"
                  fill={`url(#${gradientIdBase}-fcr)`}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
