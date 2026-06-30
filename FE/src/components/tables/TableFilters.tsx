
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TableFiltersProps {
  /** Filter controls (inputs, selects, chips, etc.) */
  children?: ReactNode;

  /** Optional custom className */
  className?: string;

  /** Optional alignment control */
  align?: "start" | "center" | "end";
}

export function TableFilters({
  children,
  className,
  align = "start",
}: TableFiltersProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        align === "center" && "justify-center",
        align === "end" && "justify-end",
        align === "start" && "justify-start",
        className,
      )}
      role="search"
      aria-label="Table filters"
    >
      {children}
    </div>
  );
}