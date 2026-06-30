
import type { InputHTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/utils";

interface FormDatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
  error?: string;
  className?: string;
}

export function FormDatePicker({
  label,
  description,
  error,
  className,
  id,
  ...props
}: FormDatePickerProps): ReactElement {
  const autoId =
    id ?? `date-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={autoId} className="text-sm font-medium text-foreground">
        {label}
      </label>

      <input
        id={autoId}
        type="date"
        className={cn(
          "rounded-md border px-3 py-2 text-sm outline-none transition",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          error && "border-red-500 focus:border-red-500 focus:ring-red-200",
        )}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${autoId}-error` : description ? `${autoId}-desc` : undefined
        }
        {...props}
      />

      {description && !error && (
        <p
          id={`${autoId}-desc`}
          className="text-xs text-muted-foreground"
        >
          {description}
        </p>
      )}

      {error && (
        <p id={`${autoId}-error`} className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}