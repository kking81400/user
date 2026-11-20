"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { extractErrorMessage } from "@/lib/api/http";
import { phoneSchema, type PhoneFormValues } from "@/lib/validations/auth";
import { toEnglishDigits } from "@/lib/utils";
import { FormField } from "./form-field";
import { AuthButton } from "./auth-button";
import type { PendingOtpContext } from "@/types/auth";

interface LoginFormProps {
  onOtpSent: (context: PendingOtpContext, resendSeconds?: number) => void;
  onBack: () => void;
  /** Prefill (e.g. what the user already typed in the register tab, or when
   *  coming back from the OTP step) so they never have to retype it. */
  initialPhone?: string;
  /** Called on every keystroke so the parent can remember the value across
   *  a tab switch. */
  onPhoneChange?: (phone: string) => void;
}

export function LoginForm({
  onOtpSent,
  onBack,
  initialPhone = "",
  onPhoneChange,
}: LoginFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: initialPhone },
  });

  const phoneValue = watch("phone");
  useEffect(() => {
    onPhoneChange?.(phoneValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneValue]);

  const sendOtpMutation = useMutation({
    mutationFn: authApi.loginSendOtp,
    onSuccess: (data, variables) => {
      onOtpSent({ tab: "login", phone: variables.phone }, data.expires_in);
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "ارسال کد تایید ناموفق بود"));
    },
  });

  const onSubmit = (values: PhoneFormValues) => {
    sendOtpMutation.mutate({ phone: toEnglishDigits(values.phone) });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      dir="rtl"
    >
      <FormField
        label="شماره تلفن"
        placeholder="09141234567"
        inputMode="numeric"
        dir="ltr"
        className="text-left"
        error={errors.phone?.message}
        {...register("phone")}
      />

      <AuthButton type="submit" loading={sendOtpMutation.isPending}>
        ورود
      </AuthButton>

      <button
        type="button"
        onClick={onBack}
        className="text-center text-sm text-muted-foreground hover:text-foreground"
      >
        بازگشت
      </button>
    </form>
  );
}
