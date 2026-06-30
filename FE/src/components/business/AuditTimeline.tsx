
import type { ReactElement } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "assigned"
  | "status_changed"
  | "commented"
  | "escalated"
  | "resolved"
  | "reopened"
  | string;

export interface AuditFieldChange {
  field: string;
  from: string | null;
  to: string | null;
}

export interface AuditEntry {
  id: string;
  action: AuditAction;
  label: string;
  actor: string;
  timestamp: string | Date;
  changes?: AuditFieldChange[];
}

interface AuditTimelineProps {
  entries: AuditEntry[];
  className?: string;
  maxVisible?: number;
}

// ---------------------------------------------------------------------------
// Action mapping (safe + immutable)
// ---------------------------------------------------------------------------

const ACTION_ICON: Record<string, string> = {
  created: "✦",
  updated: "✎",
  deleted: "✕",
  assigned: "→",
  status_changed: "◎",
  commented: "💬",
  escalated: "⚡",
  resolved: "✓",
  reopened: "↩",
};

const ACTION_COLOR: Record<string, string> = {
  created: "bg-blue-500",
  updated: "bg-amber-500",
  deleted: "bg-red-500",
  assigned: "bg-violet-500",
  status_changed: "bg-sky-500",
  commented: "bg-slate-500",
  escalated: "bg-orange-500",
  resolved: "bg-emerald-500",
  reopened: "bg-indigo-500",
};

// ---------------------------------------------------------------------------
// Safe date helper
// ---------------------------------------------------------------------------

function safeDate(input: string | Date): Date | null {
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldChanges({
  changes,
}: {
  changes: AuditFieldChange[];
}): ReactElement {
  return (
    <dl className="mt-2 space-y-1 rounded-md border bg-muted/40 px-3 py-2 text-xs">
      {changes.map((c) => (
        <div
          key={c.field}
          className="grid grid-cols-[auto_1fr] gap-x-2"
        >
          <dt className="font-medium text-foreground capitalize">
            {c.field}:
          </dt>

          <dd className="text-muted-foreground">
            {c.from && (
              <span className="line-through opacity-60">
                {c.from}
              </span>
            )}

            {c.from && c.to && <span className="mx-1">→</span>}

            {c.to && (
              <span className="font-medium text-foreground">
                {c.to}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AuditTimeline({
  entries,
  className,
  maxVisible = 0,
}: AuditTimelineProps): ReactElement {
  if (!entries.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No audit history available.
      </p>
    );
  }

  const visible =
    maxVisible > 0 ? entries.slice(0, maxVisible) : entries;

  const truncatedCount = Math.max(0, entries.length - visible.length);

  return (
    <div className={cn("space-y-1", className)}>
      <ol
        role="list"
        aria-label="Audit history"
        className="relative space-y-0"
      >
        {visible.map((entry, idx) => {
          const date = safeDate(entry.timestamp);

          const relative = date
            ? formatDistanceToNow(date, { addSuffix: true })
            : "invalid date";

          const absolute = date ? format(date, "PPpp") : "";

          const isLast = idx === visible.length - 1;

          return (
            <li
              key={entry.id}
              className="relative flex gap-4 pb-6"
            >
              {/* connector line */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute left-3.5 top-8 h-full w-px bg-border"
                />
              )}

              {/* icon */}
              <span
                aria-hidden="true"
                title={entry.action}
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                  ACTION_COLOR[entry.action] ?? "bg-muted-foreground",
                )}
              >
                {ACTION_ICON[entry.action] ?? "•"}
              </span>

              {/* content */}
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-sm font-medium leading-snug text-foreground">
                  {entry.label}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {entry.actor}
                  </span>

                  <span aria-hidden="true"> · </span>

                  <time
                    dateTime={date?.toISOString()}
                    title={absolute}
                  >
                    {relative}
                  </time>
                </p>

                {entry.changes?.length ? (
                  <FieldChanges changes={entry.changes} />
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {truncatedCount > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          +{truncatedCount} older{" "}
          {truncatedCount === 1 ? "entry" : "entries"} not shown.
        </p>
      )}
    </div>
  );
}