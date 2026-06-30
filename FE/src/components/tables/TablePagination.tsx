
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

interface TablePaginationProps {
  /** Current page (1-based index) */
  page: number;

  /** Total number of pages */
  totalPages?: number;

  /** Called when user changes page */
  onPageChange?: (page: number) => void;

  /** Disable interactions */
  disabled?: boolean;

  className?: string;
}

export function TablePagination({
  page,
  totalPages = 1,
  onPageChange,
  disabled = false,
  className,
}: TablePaginationProps): ReactElement {
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  function goTo(nextPage: number) {
    if (disabled) return;
    if (nextPage < 1 || nextPage > totalPages) return;
    onPageChange?.(nextPage);
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 text-sm",
        className,
      )}
      role="navigation"
      aria-label="Table pagination"
    >
      {/* Left Info */}
      <span className="text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span>
        {totalPages > 1 && (
          <>
            {" "}
            of{" "}
            <span className="font-medium text-foreground">
              {totalPages}
            </span>
          </>
        )}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => goTo(page - 1)}
          disabled={!canGoPrev || disabled}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs transition",
            "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Previous
        </button>

        <button
          onClick={() => goTo(page + 1)}
          disabled={!canGoNext || disabled}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs transition",
            "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}