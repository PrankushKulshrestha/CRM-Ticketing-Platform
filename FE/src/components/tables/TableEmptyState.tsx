
import type { ReactElement, ReactNode } from "react";

interface TableEmptyStateProps {
  /** Message to display when no data is available */
  message?: string;
  /** Optional icon or illustration */
  icon?: ReactNode;
  /** Optional custom action (e.g., button to refresh or create) */
  action?: ReactNode;
  className?: string;
}

export function TableEmptyState({
  message = "No records found.",
  icon,
  action,
  className,
}: TableEmptyStateProps): ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      {/* Icon */}
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}

      {/* Message */}
      <p className="text-sm text-muted-foreground">{message}</p>

      {/* Optional action */}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}