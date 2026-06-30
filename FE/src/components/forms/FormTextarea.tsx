
import React, { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FormTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  textareaClassName?: string;
}

export const FormTextarea = forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(
  (
    {
      label,
      error,
      id,
      className,
      wrapperClassName,
      labelClassName,
      textareaClassName,
      ...props
    },
    ref,
  ) => {
    const generatedId =
      id ?? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className={cn("flex flex-col gap-1", wrapperClassName)}>
        <label
          htmlFor={generatedId}
          className={cn("text-sm font-medium", labelClassName)}
        >
          {label}
        </label>

        <textarea
          ref={ref}
          id={generatedId}
          className={cn(
            "min-h-25 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            textareaClassName,
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />

        {error && (
          <p className="text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

FormTextarea.displayName = "FormTextarea";