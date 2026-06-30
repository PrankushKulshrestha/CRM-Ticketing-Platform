
import { useMemo } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TicketStatus =
  | "new"
  | "open"
  | "in_progress"
  | "pending"
  | "reopened"
  | "request_clarification"
  | "on_hold"
  | "resolved"
  | "closed";

export interface TicketStatusBadgeProps {
  status: TicketStatus | string | null | undefined;
  showDot?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface StatusConfig {
  label: string;
  dot: string;
  badge: string;
}

const STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  new: {
    label: "New",
    dot: "bg-blue-500",
    badge:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  open: {
    label: "Open",
    dot: "bg-sky-500",
    badge:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
  },
  in_progress: {
    label: "In Progress",
    dot: "bg-violet-500",
    badge:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
  },
  pending: {
    label: "Pending",
    dot: "bg-amber-500",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  reopened: {
    label: "Reopened",
    dot: "bg-orange-500",
    badge:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300",
  },
  request_clarification: {
    label: "Clarification",
    dot: "bg-purple-500",
    badge:
      "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300",
  },
  on_hold: {
    label: "On Hold",
    dot: "bg-slate-500",
    badge:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  },
  resolved: {
    label: "Resolved",
    dot: "bg-emerald-500",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  closed: {
    label: "Closed",
    dot: "bg-zinc-500",
    badge:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
  },
};

const FALLBACK_CONFIG: StatusConfig = {
  label: "Unknown",
  dot: "bg-muted-foreground",
  badge: "border-border bg-muted text-muted-foreground",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeStatus(
  status?: string | null,
): TicketStatus | null {
  if (!status) return null;

  const normalized = status.toLowerCase().trim();

  return (normalized in STATUS_CONFIG
    ? (normalized as TicketStatus)
    : null);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TicketStatusBadge({
  status,
  showDot = true,
  className,
}: TicketStatusBadgeProps): React.ReactElement {
  const config = useMemo(() => {
    const normalized = normalizeStatus(status);
    return normalized ? STATUS_CONFIG[normalized] : FALLBACK_CONFIG;
  }, [status]);

  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.badge,
        className,
      )}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 rounded-full", config.dot)}
        />
      )}

      {config.label}
    </span>
  );
}