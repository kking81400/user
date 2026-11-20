"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import "./profile.css";

/* همه‌ی رنگ‌ها از متغیرهای profile.css می‌آیند و خودکار با تم عوض می‌شوند */
export const inputCls =
    "h-12 w-full rounded-xl border border-[color:var(--pf-border)] bg-[color:var(--pf-field)] px-4 text-sm " +
    "text-[color:var(--pf-text)] placeholder:text-[color:var(--pf-text-faint)] outline-none transition-colors " +
    "focus:border-[color:var(--pf-brand)] focus:ring-2 focus:ring-[color:var(--pf-ring)] disabled:opacity-60";

export const primaryBtn =
    "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[color:var(--pf-brand)] px-8 text-sm font-medium " +
    "text-[color:var(--pf-on-brand)] transition-colors hover:bg-[color:var(--pf-brand-hover)] " +
    "disabled:cursor-not-allowed disabled:opacity-60";

export const outlineBtn =
    "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[color:var(--pf-brand-text)] bg-transparent px-6 text-sm " +
    "text-[color:var(--pf-brand-text)] transition-colors hover:bg-[color:var(--pf-brand-soft)] disabled:opacity-60";

export const ghostBtn =
    "h-12 rounded-xl px-6 text-sm text-[color:var(--pf-text)] transition-colors hover:bg-[color:var(--pf-hover)]";

export const cardCls =
    "rounded-3xl border border-[color:var(--pf-border)] bg-[color:var(--pf-card)]";

export const dividerCls = "h-px w-full bg-[color:var(--pf-border-soft)]";

interface FieldProps {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, error, className, children }: FieldProps) {
  return (
      <div className={cn("flex flex-col gap-2", className)}>
        <label className="text-sm text-[color:var(--pf-text-muted)]">{label}</label>
        {children}
        {error && <p className="text-xs text-[color:var(--pf-danger)]">{error}</p>}
      </div>
  );
}