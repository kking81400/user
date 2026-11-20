"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-accent-label"
        >
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-14 w-full rounded-2xl border border-border bg-input px-4 text-base text-foreground placeholder:text-muted-foreground outline-none transition-colors",
            "focus:border-primary focus:ring-2 focus:ring-primary/25",
            error && "border-destructive focus:ring-destructive/25",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
FormField.displayName = "FormField";
