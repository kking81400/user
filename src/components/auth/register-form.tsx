"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { extractErrorMessage } from "@/lib/api/http";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { toEnglishDigits, cn } from "@/lib/utils";
import { FormField } from "./form-field";
import { AuthButton } from "./auth-button";
import type { Gender, PendingOtpContext } from "@/types/auth";

interface RegisterFormDraft {
  phone?: string;
  first_name?: string;
  last_name?: string;
  gender?: Gender;
}

interface RegisterFormProps {
  onOtpSent: (context: PendingOtpContext, resendSeconds?: number) => void;
  onBack: () => void;
  /** Prefill from a previous attempt (tab switch or back-from-OTP) so
   *  nothing typed is ever lost. */
  initialValues?: RegisterFormDraft;
  /** Fired on every change so the parent can remember the draft. */
  onDraftChange?: (draft: RegisterFormDraft) => void;
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "مرد" },
  { value: "female", label: "زن" },
];

export function RegisterForm({
  onOtpSent,
  onBack,
  initialValues,
  onDraftChange,
}: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: initialValues?.phone ?? "",
      first_name: initialValues?.first_name ?? "",
      last_name: initialValues?.last_name ?? "",
      gender: initialValues?.gender,
    },
  });

  const gender = watch("gender");
  const watchedValues = watch();
  useEffect(() => {
    onDraftChange?.(watchedValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues.phone, watchedValues.first_name, watchedValues.last_name, watchedValues.gender]);

  const sendOtpMutation = useMutation({
    mutationFn: authApi.registerSendOtp,
    onSuccess: (data, variables) => {
      onOtpSent(
        {
          tab: "register",
          phone: variables.phone,
          firstName: variables.first_name,
          lastName: variables.last_name,
        },
        data.expires_in,
      );
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "ارسال کد تایید ناموفق بود"));
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    // NOTE: `gender` isn't part of the register/send-otp contract you shared,
    // so it's collected here (as in the design) but only phone/first/last are
    // sent to the API. If the backend later accepts it, add it to
    // RegisterSendOtpPayload and pass it through here.
    sendOtpMutation.mutate({
      phone: toEnglishDigits(values.phone),
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
    });
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
      <FormField
        label="نام"
        placeholder="هادی"
        error={errors.first_name?.message}
        {...register("first_name")}
      />
      <FormField
        label="نام خانوادگی"
        placeholder="اویسی"
        error={errors.last_name?.message}
        {...register("last_name")}
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-accent-label">جنسیت</span>
        <div className="flex gap-2" role="radiogroup" aria-label="جنسیت">
          {GENDER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={gender === option.value}
              onClick={() => setValue("gender", option.value)}
              className={cn(
                "h-12 flex-1 rounded-2xl border text-sm font-medium transition-colors",
                gender === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-input text-foreground hover:bg-muted/60",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <AuthButton type="submit" loading={sendOtpMutation.isPending}>
        ثبت نام
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
