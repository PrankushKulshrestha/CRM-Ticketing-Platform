
import { cn, formatLabel } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TicketStatus =
  | "new"
  | "open"
  | "in_progress"
  | "pending"
  | "on_hold"
  | "resolved"
  | "closed"
  | string;

export interface StatusStep {
  status: TicketStatus;
  label?: string;
  reachedAt?: string | Date;
}

export interface StatusTimelineProps {
  steps: StatusStep[];
  currentStatus: TicketStatus;
  className?: string;
}

type StepState = "completed" | "active" | "upcoming";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const STEP_STYLES: Record<StepState, { dot: string; label: string; connector: string }> = {
  completed: {
    dot:       "border-primary bg-primary text-primary-foreground",
    label:     "text-foreground",
    connector: "bg-primary",
  },
  active: {
    dot:       "border-primary bg-background text-primary ring-4 ring-primary/20",
    label:     "text-primary font-semibold",
    connector: "bg-muted",
  },
  upcoming: {
    dot:       "border-muted-foreground bg-background text-muted-foreground",
    label:     "text-muted-foreground",
    connector: "bg-muted",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatusTimeline({
  steps,
  currentStatus,
  className,
}: StatusTimelineProps): React.ReactElement {
  if (!steps.length) return <></>;

  const currentIndex = steps.findIndex((s) => s.status === currentStatus);

  return (
    <nav aria-label="Ticket status timeline" className={cn("w-full", className)}>
      <ol role="list" className="flex w-full items-start">
        {steps.map((step, idx) => {
          const isCompleted = currentIndex !== -1 && idx < currentIndex;
          const isActive    = idx === currentIndex;
          const state: StepState = isActive ? "active" : isCompleted ? "completed" : "upcoming";

          const styles  = STEP_STYLES[state];
          // formatLabel imported from @/lib/utils instead of inline definition
          const label   = step.label ?? formatLabel(step.status);
          const isLast  = idx === steps.length - 1;

          return (
            <li
              key={`${step.status}-${idx}`}
              className="relative flex flex-1 flex-col items-center gap-2"
            >
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-1/2 top-3.5 h-0.5 w-full",
                    styles.connector,
                  )}
                />
              )}

              <span
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  styles.dot,
                )}
              >
                {isCompleted ? "✓" : idx + 1}
              </span>

              <span className={cn("text-center text-xs leading-tight", styles.label)}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}