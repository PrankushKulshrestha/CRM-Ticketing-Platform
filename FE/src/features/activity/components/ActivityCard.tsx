
import type { ReactElement, ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityVariant =
  | "default"
  | "created"
  | "resolved"
  | "escalated"
  | "commented"
  | "assigned";

export interface ActivityCardProps {
  title: string;
  description?: string;
  actor?: string;
  timestamp?: string | Date;
  variant?: ActivityVariant;
  isUnread?: boolean;
  icon?: ReactNode;
  className?: string;
}

// ---------------------------------------------------------------------------
// Variant styles
// ---------------------------------------------------------------------------

const VARIANT_BORDER = {
  default: "border-l-border",
  created: "border-l-blue-500",
  resolved: "border-l-emerald-500",
  escalated: "border-l-red-500",
  commented: "border-l-amber-500",
  assigned: "border-l-violet-500",
} as const;

// ---------------------------------------------------------------------------
// Safe date formatter
// ---------------------------------------------------------------------------

function getRelativeTime(timestamp?: string | Date): {
  relative: string | null;
  iso: string | null;
} {
  if (!timestamp) return { relative: null, iso: null };

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return { relative: null, iso: null };
  }

  return {
    relative: formatDistanceToNow(date, { addSuffix: true }),
    iso: date.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityCard({
  title,
  description,
  actor,
  timestamp,
  variant = "default",
  isUnread = false,
  icon,
  className,
}: ActivityCardProps): ReactElement {
  const { relative, iso } = getRelativeTime(timestamp);

  return (
    <article
      aria-label={`Activity: ${title}`}
      data-unread={isUnread ? true : undefined}
      className={cn(
        "relative rounded-xl border border-l-4 bg-card p-4 shadow-sm transition-colors",
        VARIANT_BORDER[variant],
        isUnread && "bg-accent/40",
        className,
      )}
    >
      {/* Unread indicator */}
      {isUnread && (
        <span
          aria-hidden="true"
          className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary"
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        {icon && (
          <span
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-muted-foreground"
          >
            {icon}
          </span>
        )}

        <div className="min-w-0 flex-1 space-y-1">
          {/* Title */}
          <p className="text-sm font-medium leading-snug text-foreground">
            {title}
          </p>

          {/* Description */}
          {description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}

          {/* Footer */}
          {(actor || relative) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 text-xs text-muted-foreground">
              {actor && (
                <span className="font-medium text-foreground">
                  {actor}
                </span>
              )}

              {actor && relative && <span aria-hidden="true">·</span>}

              {relative && (
                <time dateTime={iso ?? undefined}>{relative}</time>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}