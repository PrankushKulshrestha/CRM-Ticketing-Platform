
import type { ReactElement } from "react";

interface TableLoadingStateProps {
  /** Optional loading message */
  message?: string;

  /** Optional show skeleton rows instead of text */
  variant?: "text" | "skeleton";
}

export function TableLoadingState({
  message = "Loading...",
  variant = "text",
}: TableLoadingStateProps): ReactElement {
  if (variant === "skeleton") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full animate-pulse space-y-3 py-6"
      >
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading table data"
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />

      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}