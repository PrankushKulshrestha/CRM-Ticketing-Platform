
import { useMemo } from "react";
import { differenceInSeconds, formatDistanceToNowStrict } from "date-fns";
import { cn, clamp, toDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SLAIndicatorProps {
  dueAt?: string | Date;
  createdAt?: string | Date;
  breached?: boolean;
  paused?: boolean;
  showProgress?: boolean;
  className?: string;
}

type SLAState = "healthy" | "warning" | "breached" | "paused";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getSLAState(params: {
  due: Date;
  created: Date;
  now: Date;
  breached: boolean;
}): SLAState {
  const { due, now, breached, created } = params;

  if (breached || now > due) return "breached";

  const total = Math.max(differenceInSeconds(due, created), 1);
  const remaining = differenceInSeconds(due, now);
  const ratio = remaining / total;

  return ratio > 0.5 ? "healthy" : "warning";
}

function getProgress(due: Date, created: Date, now: Date): number {
  const total = Math.max(differenceInSeconds(due, created), 1);
  const elapsed = differenceInSeconds(now, created);
  // clamp imported from @/lib/utils
  return clamp(elapsed / total);
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const STATE_STYLES: Record<SLAState, { badge: string; bar: string; label: string }> = {
  healthy: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    bar:   "bg-emerald-500",
    label: "On Track",
  },
  warning: {
    badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
    bar:   "bg-amber-500",
    label: "Due Soon",
  },
  breached: {
    badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
    bar:   "bg-red-500",
    label: "Breached",
  },
  paused: {
    badge: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    bar:   "bg-slate-400",
    label: "Paused",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SLAIndicator({
  dueAt,
  createdAt,
  breached = false,
  paused = false,
  showProgress = true,
  className,
}: SLAIndicatorProps): React.ReactElement {
  const result = useMemo(() => {
    const now = new Date();

    if (paused) return { state: "paused" as SLAState, label: "Paused", progress: 0 };

    // toDate imported from @/lib/utils
    const due     = toDate(dueAt);
    const created = toDate(createdAt) ?? new Date(now.getTime() - 60 * 60 * 1000);

    if (!due) return { state: "healthy" as SLAState, label: "No SLA set", progress: 0 };

    const state    = getSLAState({ due, created, now, breached });
    const isOverdue = now > due;
    const label    = `${formatDistanceToNowStrict(due)} ${isOverdue ? "overdue" : "remaining"}`;

    return { state, label, progress: getProgress(due, created, now) };
  }, [dueAt, createdAt, breached, paused]);

  const styles = STATE_STYLES[result.state];

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <span
        role="status"
        aria-label={`SLA: ${styles.label} — ${result.label}`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          styles.badge,
        )}
      >
        {result.state === "breached" && (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"
          />
        )}
        <span>{styles.label}</span>
        <span className="opacity-60">·</span>
        <span className="opacity-80">{result.label}</span>
      </span>

      {showProgress && dueAt && !paused && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(result.progress * 100)}
          aria-label="SLA progress"
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn("h-full rounded-full transition-all", styles.bar)}
            style={{ width: `${Math.round(result.progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}