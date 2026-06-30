
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

interface FormRadioGroupProps {
  name: string;
  options: string[];

  /** Controlled value */
  value?: string;

  /** Custom change handler (value-based, NOT event-based) */
  onChange?: (value: string) => void;

  className?: string;
  labelClassName?: string;
  optionClassName?: string;

  disabled?: boolean;
}

export function FormRadioGroup({
  name,
  options,
  value,
  onChange,
  className,
  labelClassName,
  optionClassName,
  disabled,
}: FormRadioGroupProps): ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn("flex flex-wrap gap-3", className)}
    >
      {options.map((option) => {
        const id = `${name}-${option.toLowerCase().replace(/\s+/g, "-")}`;
        const isSelected = value === option;

        return (
          <label
            key={option}
            htmlFor={id}
            className={cn(
              "flex cursor-pointer items-center gap-2 text-sm",
              disabled && "cursor-not-allowed opacity-50",
              labelClassName,
            )}
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={option}
              checked={isSelected}
              disabled={disabled}
              onChange={() => onChange?.(option)}
              className={cn("h-4 w-4 accent-primary", optionClassName)}
            />

            <span
              className={cn(
                isSelected && "font-medium text-foreground",
              )}
            >
              {option}
            </span>
          </label>
        );
      })}
    </div>
  );
}