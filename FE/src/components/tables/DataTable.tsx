
import type { ReactNode } from "react";
import { TableEmptyState } from "./TableEmptyState";
import { TableLoadingState } from "./TableLoadingState";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (row: T, index: number) => string;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No records found.",
  keyExtractor,
  className,
}: DataTableProps<T>): React.ReactElement {
  /* ------------------------------ Loading State --------------------------- */
  if (isLoading) {
    return <TableLoadingState />;
  }

  const hasData = data.length > 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60 text-sm">
          {/* ------------------------------ Header ------------------------------ */}
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  className={cn("px-4 py-3 font-medium", col.headerClassName)}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>

          {/* ------------------------------ Body -------------------------------- */}
          <tbody className="divide-y divide-border/60">
            {!hasData ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center"
                >
                  <TableEmptyState message={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowKey =
                  keyExtractor?.(row, index) ?? (index as unknown as string);

                return (
                  <tr
                    key={rowKey}
                    className="transition-colors hover:bg-muted/20"
                  >
                    {columns.map((col) => {
                      const value =
                        typeof col.key === "string"
                          ? (row as Record<string, unknown>)[col.key]
                          : (row as unknown as Record<string, unknown>)[
                              String(col.key)
                            ];

                      return (
                        <td
                          key={String(col.key)}
                          className={cn("px-4 py-3", col.className)}
                        >
                          {col.render
                            ? col.render(row, index)
                            : String(value ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}