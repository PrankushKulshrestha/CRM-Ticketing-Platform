
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

interface FormSelectProps {
  label: string;
  options: string[];

  /** Controlled value */
  value?: string;

  /** Value-based change handler (NOT DOM event) */
  onChange?: (value: string) => void;

  id?: string;
  name?: string;
  disabled?: boolean;

  className?: string;
  labelClassName?: string;
  selectClassName?: string;
}

export function FormSelect({
  label,
  options,
  value,
  onChange,
  id,
  name,
  disabled,
  className,
  labelClassName,
  selectClassName,
}: FormSelectProps): ReactElement {
  const selectId =
    id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label
      htmlFor={selectId}
      className={cn(
        "flex flex-col gap-1 text-sm font-medium text-foreground",
        className,
      )}
    >
      <span className={cn(labelClassName)}>{label}</span>

      <select
        id={selectId}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "rounded-md border border-input bg-background px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          selectClassName,
        )}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}