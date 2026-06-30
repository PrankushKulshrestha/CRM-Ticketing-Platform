
import React, { useId, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { TtrBucket } from "../types/analytics.types";

interface Props {
  buckets?: TtrBucket[];
  sampleSize?: number;
  meanHours?: number | null;
  medianHours?: number | null;
  isLoading?: boolean;
}

function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return "—";
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

/*
 * Bars get progressively warmer the further out the bucket is — fast
 * resolutions (greens) reading as healthy, the long tail (reds) reading
 * as something to investigate. Mirrors the semantic status palette used
 * elsewhere (success/warning/danger) rather than a single flat fill.
 */
function colorForBucketIndex(index: number, total: number): string {
  const ratio = total <= 1 ? 0 : index / (total - 1);
  if (ratio < 0.33) return "var(--success)";
  if (ratio < 0.66) return "var(--warning)";
  return "var(--danger)";
}

export default function ResolutionHistogram({
  buckets = [],
  sampleSize = 0,
  meanHours = null,
  medianHours = null,
  isLoading = false,
}: Props): React.ReactElement {
  const gradientIdBase = useId();

  const chartData = useMemo(
    () =>
      buckets.map((b, index) => ({
        label: b.label,
        count: b.count,
        color: colorForBucketIndex(index, buckets.length),
      })),
    [buckets],
  );

  const hasData = sampleSize > 0;

  return (
    <Card className="border border-border/50">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base font-semibold">
            Time to Resolution (TTR)
          </CardTitle>
          <CardDescription>
            Hour-by-hour distribution of how long resolved tickets took, from
            creation to resolution
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-4 text-right">
          <div>
            <p className="text-xs text-muted-foreground">Mean (MTTR)</p>
            <p className="text-lg font-bold">{formatHours(meanHours)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Median</p>
            <p className="text-lg font-bold">{formatHours(medianHours)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex h-72 w-full min-w-0 animate-pulse items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
            Loading resolution histogram…
          </div>
        ) : !hasData ? (
          <div className="flex h-72 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border/70 bg-muted/20 text-center text-sm text-muted-foreground">
            <p>No resolved tickets yet.</p>
            <p className="text-xs">
              The histogram fills in as tickets get resolved or closed.
            </p>
          </div>
        ) : (
          <>
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id={`${gradientIdBase}-bar`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopOpacity={0.95} />
                      <stop offset="100%" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" opacity={0.08} />

                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Tickets",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: 11, fill: "var(--muted-foreground)" },
                    }}
                  />

                  <Tooltip
                    formatter={(value) => [Number(value ?? 0), "Tickets"]}
                    labelFormatter={(label) => `Resolved in ${label}`}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    }}
                  />

                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Based on {sampleSize} resolved {sampleSize === 1 ? "ticket" : "tickets"}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
