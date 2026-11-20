"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  loading?: boolean;
}

export const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ variant = "primary", loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "flex h-14 w-full items-center justify-center rounded-2xl text-base font-semibold transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-60",
          variant === "primary" &&
            "bg-primary text-primary-foreground hover:brightness-105 active:brightness-95",
          variant === "ghost" &&
            "bg-transparent text-foreground hover:bg-muted/60",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </button>
    );
  },
);
AuthButton.displayName = "AuthButton";
