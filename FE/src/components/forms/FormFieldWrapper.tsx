
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldWrapperProps {
  label: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
  htmlFor?: string;
  description?: string;
}

export function FormFieldWrapper({
  label,
  children,
  className,
  required,
  htmlFor,
  description,
}: FormFieldWrapperProps): ReactElement {
  const descriptionId = description
    ? `${label.toLowerCase().replace(/\s+/g, "-")}-desc`
    : undefined;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div aria-describedby={descriptionId}>{children}</div>

      {description && (
        <p
          id={descriptionId}
          className="text-xs text-muted-foreground"
        >
          {description}
        </p>
      )}
    </div>
  );
}