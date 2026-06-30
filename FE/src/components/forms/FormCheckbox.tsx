
import type { InputHTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/utils";

interface FormCheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
  className?: string;
}

export function FormCheckbox({
  label,
  description,
  className,
  id,
  ...props
}: FormCheckboxProps): ReactElement {
  const autoId =
    id ?? `checkbox-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <input
        id={autoId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-primary"
        {...props}
      />

      <label htmlFor={autoId} className="cursor-pointer select-none">
        <span className="text-sm font-medium">{label}</span>

        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </label>
    </div>
  );
}