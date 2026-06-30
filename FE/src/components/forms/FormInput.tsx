
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id?: string;
}

export function FormInput({
  label,
  id,
  className,
  ...props
}: FormInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label
      htmlFor={inputId}
      className="flex flex-col gap-1 text-sm font-medium text-foreground"
    >
      <span>{label}</span>

      <input
        id={inputId}
        {...props}
        className={cn(
          "rounded-md border border-input bg-background px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      />
    </label>
  );
}