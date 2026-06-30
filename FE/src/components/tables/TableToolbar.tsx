
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TableToolbarProps {
  /** Toolbar content (filters, actions, search, etc.) */
  children?: ReactNode;

  /** Optional custom styling */
  className?: string;

  /** Layout mode for better flexibility */
  layout?: "between" | "start" | "end";
}

export function TableToolbar({
  children,
  className,
  layout = "between",
}: TableToolbarProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        layout === "between" && "justify-between",
        layout === "start" && "justify-start",
        layout === "end" && "justify-end",
        className,
      )}
      role="toolbar"
      aria-label="Table toolbar"
    >
      {children}
    </div>
  );
}