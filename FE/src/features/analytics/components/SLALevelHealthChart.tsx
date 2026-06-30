
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface SLALevelHealth {
  level: number;
  count: number;
  breached: number;
  healthy: number;
}

interface Props {
  /** Always 5 entries (levels 1-5), zero-filled by the backend for empty levels. */
  data?: SLALevelHealth[];
  /** Combined org-wide compliance %, same number shown on SLAHealthCard. */
  combinedCompliance?: number;
  isLoading?: boolean;
}

const LEVEL_LABELS: Record<number, string> = {
  1: "Level 1",
  2: "Level 2",
  3: "Level 3",
  4: "Level 4",
  5: "Level 5 (Final)",
};

/* -------------------------------------------------------------------------- */

export default function SLALevelHealthChart({
  data,
  combinedCompliance,
  isLoading,
}: Props) {
  const levels = [1, 2, 3, 4, 5];
  const byLevel = new Map((data ?? []).map((d) => [d.level, d]));

  const chartData = levels.map((level) => {
    const point = byLevel.get(level);
    return {
      level: LEVEL_LABELS[level] ?? `Level ${level}`,
      healthy: point?.healthy ?? 0,
      breached: point?.breached ?? 0,
      total: point?.count ?? 0,
    };
  });

  const totalActive = chartData.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card className="border border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">
            SLA Health by Level
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Active tickets at each escalation level
          </p>
        </div>
        {typeof combinedCompliance === "number" && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Combined</p>
            <p className="text-lg font-semibold">{combinedCompliance}%</p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-10 text-center">
            Loading SLA health…
          </div>
        ) : totalActive === 0 ? (
          <div className="text-sm text-muted-foreground py-10 text-center">
            No active SLA-tracked tickets right now.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="level"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    fontSize: 12,
                    border: "1px solid var(--border)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="healthy"
                  stackId="sla"
                  name="Within SLA"
                  fill="var(--success)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="breached"
                  stackId="sla"
                  name="Breached"
                  fill="var(--danger)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 grid grid-cols-5 gap-2">
          {chartData.map((d) => (
            <div
              key={d.level}
              className="rounded-xl border border-border/60 bg-background/50 p-2 text-center"
            >
              <p className="text-[10px] text-muted-foreground truncate">{d.level}</p>
              <p className="text-sm font-semibold">{d.total}</p>
              {d.breached > 0 && (
                <p className="text-[10px] text-danger">{d.breached} breached</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
