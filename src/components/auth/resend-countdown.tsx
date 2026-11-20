"use client";

import { formatCountdown } from "@/lib/utils";

interface ResendCountdownProps {
  secondsLeft: number;
  isResending: boolean;
  onResend: () => void;
}

export function ResendCountdown({
  secondsLeft,
  isResending,
  onResend,
}: ResendCountdownProps) {
  if (secondsLeft > 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        {formatCountdown(secondsLeft)} تا ارسال دوباره کد تایید
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onResend}
      disabled={isResending}
      className="mx-auto block text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-60"
    >
      {isResending ? "در حال ارسال..." : "ارسال دوباره کد تایید"}
    </button>
  );
}
