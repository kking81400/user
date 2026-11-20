"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { extractErrorMessage } from "@/lib/api/http";
import { useAuthStore } from "@/store/auth-store";
import { useCountdown } from "@/hooks/use-countdown";
import { useGuestSession } from "@/hooks/use-guest-session";
import { OTP_LENGTH } from "@/lib/validations/auth";
import { OtpInput } from "./otp-input";
import { ResendCountdown } from "./resend-countdown";
import { AuthButton } from "./auth-button";
import type { PendingOtpContext } from "@/types/auth";

const DEFAULT_RESEND_SECONDS = 80; // matches the "1:20" shown in the design
const MAX_RESEND_ATTEMPTS = 3; // after this, block resending (anti SMS-bombing)

interface OtpStepProps {
  context: PendingOtpContext;
  initialResendSeconds?: number;
  onVerified: () => void;
  onBack: () => void;
}

export function OtpStep({
  context,
  initialResendSeconds = DEFAULT_RESEND_SECONDS,
  onVerified,
  onBack,
}: OtpStepProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const setTokens = useAuthStore((s) => s.setTokens);
  const { ensureGuestId } = useGuestSession();
  const { secondsLeft, start } = useCountdown(initialResendSeconds);

  useEffect(() => {
    start(initialResendSeconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyMutation = useMutation({
    mutationFn: async (otp: string) => {
      const guest_id = await ensureGuestId();
      return context.tab === "login"
        ? authApi.loginVerify({ phone: context.phone, code: otp, guest_id })
        : authApi.registerVerify({ phone: context.phone, code: otp, guest_id });
    },
    onSuccess: (data) => {
      setTokens(data, data.user);
      toast.success("ورود با موفقیت انجام شد");
      onVerified();
    },
    onError: (err) => {
      const message = extractErrorMessage(err, "کد تایید اشتباه است");
      setError(message);
      toast.error(message);
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      return context.tab === "login"
        ? authApi.loginSendOtp({ phone: context.phone })
        : authApi.registerSendOtp({
            phone: context.phone,
            first_name: context.firstName ?? "",
            last_name: context.lastName ?? "",
          });
    },
    onSuccess: (data) => {
      start(data.expires_in ?? DEFAULT_RESEND_SECONDS);
      setCode("");
      setError(null);
      setResendCount((count) => count + 1);
      toast.success("کد تایید مجدد ارسال شد");
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "ارسال دوباره کد ناموفق بود"));
    },
  });

  const handleComplete = (value: string) => {
    setError(null);
    verifyMutation.mutate(value);
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          کد تایید را وارد نمایید
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{context.phone}</p>
      </div>

      <OtpInput
        length={OTP_LENGTH}
        value={code}
        onChange={setCode}
        onComplete={handleComplete}
        disabled={verifyMutation.isPending}
        error={Boolean(error)}
      />
      {error && (
        <p className="-mt-3 text-center text-xs text-destructive">{error}</p>
      )}

      {resendCount >= MAX_RESEND_ATTEMPTS ? (
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-center text-sm text-muted-foreground">
            به حداکثر تعداد درخواست کد تایید رسیدید.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-primary hover:underline"
          >
            شروع دوباره
          </button>
        </div>
      ) : (
        <ResendCountdown
          secondsLeft={secondsLeft}
          isResending={resendMutation.isPending}
          onResend={() => resendMutation.mutate()}
        />
      )}

      <AuthButton
        type="button"
        loading={verifyMutation.isPending}
        disabled={code.length !== OTP_LENGTH}
        onClick={() => handleComplete(code)}
      >
        تایید
      </AuthButton>

      <button
        type="button"
        onClick={onBack}
        className="text-center text-sm text-muted-foreground hover:text-foreground"
      >
        بازگشت
      </button>
    </div>
  );
}
