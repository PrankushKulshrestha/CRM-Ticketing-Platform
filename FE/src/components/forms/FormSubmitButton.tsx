
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormSubmitButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;

  /** Optional loading state */
  isLoading?: boolean;

  /** Optional full-width variant */
  fullWidth?: boolean;
}

export function FormSubmitButton({
  children,
  className,
  disabled,
  isLoading = false,
  fullWidth = false,
  type,
  ...props
}: FormSubmitButtonProps): React.ReactElement {
  return (
    <button
      type={type ?? "submit"}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={cn(
        "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
        "transition-colors hover:bg-primary/90 active:scale-[0.99]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}