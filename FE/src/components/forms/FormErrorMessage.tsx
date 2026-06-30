
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

interface FormErrorMessageProps {
  message?: string;
  className?: string;
  id?: string;
}

export function FormErrorMessage({
  message,
  className,
  id,
}: FormErrorMessageProps): ReactElement | null {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className={cn("text-sm text-red-500", className)}
    >
      {message}
    </p>
  );
}