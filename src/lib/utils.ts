import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names safely (handles conditional + conflicting classes).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format seconds as m:ss (e.g. 80 -> "1:20"), matching the design's countdown label.
 */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Iran mobile number: 09xxxxxxxxx (11 digits, starts with 09) */
export const IR_PHONE_REGEX = /^09\d{9}$/;

/** Convert Persian/Arabic-Indic digits to plain ASCII digits (users often type فارسی numerals). */
export function toEnglishDigits(value: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value.replace(/[۰-۹٠-٩]/g, (ch) => {
    const p = persian.indexOf(ch);
    if (p !== -1) return String(p);
    const a = arabic.indexOf(ch);
    if (a !== -1) return String(a);
    return ch;
  });
}
