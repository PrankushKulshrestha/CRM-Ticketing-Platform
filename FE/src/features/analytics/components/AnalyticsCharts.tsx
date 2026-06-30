
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartItems } from "../types/chart.types";

interface Props {
  title: string;
  items?: ChartItems | null;
}

const formatLabel = (key: string): string =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function AnalyticsCharts({ title, items }: Props) {
  const safeItems: ChartItems = items ?? {};

  const entries = Object.entries(safeItems);

  const max = entries.reduce((acc, [, v]) => Math.max(acc, v), 1);

  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {entries.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            No analytics data available
          </div>
        ) : (
          entries.map(([key, value]) => {
            const safePercent = max > 0 ? (value / max) * 100 : 0;

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">
                    {formatLabel(key)}
                  </span>

                  <span className="font-medium">{value}</span>
                </div>

                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${safePercent}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}