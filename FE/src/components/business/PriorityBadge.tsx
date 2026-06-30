
import { useMemo } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Priority = "low" | "medium" | "high" | "critical" | "urgent";

// Adjust this mapping to match whatever your API/DB actually sends
const COLOR_CODE_TO_PRIORITY: Record<number, Priority> = {
  1: "low",
  2: "medium",
  3: "high",
  4: "urgent",
};

export interface PriorityBadgeProps {
  priority?: Priority | string | number | null;
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface PriorityConfig {
  label: string;
  icon: string;
  className: string;
}

const PRIORITY_CONFIG: Record<Priority, PriorityConfig> = {
  low: {
    label: "Low",
    icon: "↓",
    className:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  },
  medium: {
    label: "Medium",
    icon: "→",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  high: {
    label: "High",
    icon: "↑",
    className:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300",
  },
  critical: {
    label: "Critical",
    icon: "⚡",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
  urgent: {
    label: "Urgent",
    icon: "🚨",
    className:
      "border-red-300 bg-red-100 text-red-800 font-bold dark:border-red-700 dark:bg-red-900 dark:text-red-200",
  },
};

const FALLBACK_CONFIG: PriorityConfig = {
  label: "Unknown",
  icon: "?",
  className: "border-border bg-muted text-muted-foreground",
};

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizePriority(value?: string | number | null): Priority | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return COLOR_CODE_TO_PRIORITY[value] ?? null;
  }
  const normalized = value.toLowerCase().trim();
  return normalized in PRIORITY_CONFIG ? (normalized as Priority) : null;
}
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PriorityBadge({
  priority,
  showIcon = true,
  showLabel = true,
  className,
}: PriorityBadgeProps): React.ReactElement {
  const config = useMemo(() => {
    const normalized = normalizePriority(priority);
    return normalized ? PRIORITY_CONFIG[normalized] : FALLBACK_CONFIG;
  }, [priority]);

  const labelText = useMemo(() => {
    return `Priority: ${config.label}`;
  }, [config.label]);

  return (
    <span
      role="status"
      aria-label={labelText}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs",
        config.className,
        className,
      )}
    >
      {showIcon && (
        <span aria-hidden="true" className="leading-none">
          {config.icon}
        </span>
      )}

      {showLabel && <span>{config.label}</span>}
    </span>
  );
}