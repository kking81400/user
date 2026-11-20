"use client";

import { useRef } from "react";
import { cn, toEnglishDigits } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  error,
  autoFocus = true,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const commit = (next: string) => {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleChange = (index: number, raw: string) => {
    const clean = toEnglishDigits(raw).replace(/\D/g, "");
    if (!clean) {
      // deletion via typing over the box
      commit(value.slice(0, index) + value.slice(index + 1));
      return;
    }

    // support pasting the whole code into one box
    if (clean.length > 1) {
      const merged = (value.slice(0, index) + clean).slice(0, length);
      commit(merged);
      const nextEmpty = Math.min(merged.length, length - 1);
      inputsRef.current[nextEmpty]?.focus();
      return;
    }

    const next = value.slice(0, index) + clean + value.slice(index + 1);
    commit(next.slice(0, length));
    if (index < length - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index < length - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
    if (e.key === "ArrowRight" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = toEnglishDigits(e.clipboardData.getData("text")).replace(/\D/g, "");
    if (!pasted) return;
    commit(pasted.slice(0, length));
    const lastIndex = Math.min(pasted.length, length) - 1;
    inputsRef.current[Math.max(lastIndex, 0)]?.focus();
  };

  return (
    <div
      dir="ltr"
      className="flex items-center justify-center gap-2 sm:gap-3"
      role="group"
      aria-label="کد تایید"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          aria-label={`رقم ${index + 1} کد تایید`}
          className={cn(
            "h-12 w-11 rounded-xl border bg-card text-center text-lg font-semibold text-foreground shadow-sm outline-none transition-colors",
            "focus:border-primary focus:ring-2 focus:ring-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error ? "border-destructive" : "border-border",
          )}
        />
      ))}
    </div>
  );
}
