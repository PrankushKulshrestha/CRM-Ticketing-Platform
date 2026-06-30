
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps): React.ReactElement {
  return (
    <header
      role="banner"
      className={cn(
        "flex flex-col gap-4 border-b bg-background pb-6",
        className,
      )}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <nav aria-label="Breadcrumb">{breadcrumbs}</nav>
      )}

      {/* Header content */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        {/* Title block */}
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-3xl font-bold tracking-tight">
            {title}
          </h1>

          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div
            className="flex flex-wrap items-center gap-2 md:justify-end"
            aria-label="Page actions"
          >
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}