
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  className?: string;
  /** Optional aria label override for accessibility */
  ariaLabel?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  ariaLabel,
}: StatCardProps): React.ReactElement {
  return (
    <Card
      role="group"
      aria-label={ariaLabel ?? `${title} statistic card`}
      className={cn(
        "dashboard-card border-border/60 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg",
        "focus-within:ring-2 focus-within:ring-primary/30",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* LEFT CONTENT */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>

            <p
              className="mt-2 text-3xl font-bold tracking-tight text-foreground"
              aria-live="polite"
            >
              {value}
            </p>

            {trend && (
              <p className="mt-2 text-sm text-muted-foreground">
                {trend}
              </p>
            )}
          </div>

          {/* ICON */}
          {Icon && (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30"
              aria-hidden="true"
            >
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}