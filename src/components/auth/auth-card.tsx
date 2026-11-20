"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { OtpStep } from "./otp-step";
import type { AuthStep, AuthTab, PendingOtpContext } from "@/types/auth";

interface AuthCardProps {
  /** Called once tokens are stored after a successful OTP verification. */
  onAuthenticated: () => void;
  /** "بازگشت" from the very first screen — usually router.back() or a home link. */
  onExit: () => void;
  /** "فروشگاه‌ها" link target; omit to hide it. */
  storesHref?: string;
  defaultTab?: AuthTab;
  className?: string;
}

export function AuthCard({
  onAuthenticated,
  onExit,
  storesHref,
  defaultTab = "register",
  className,
}: AuthCardProps) {
  const [tab, setTab] = useState<AuthTab>(defaultTab);
  const [step, setStep] = useState<AuthStep>("form");
  const [pending, setPending] = useState<PendingOtpContext | null>(null);
  const [resendSeconds, setResendSeconds] = useState<number | undefined>();

  // Kept across tab switches AND when the user hits "بازگشت" from the OTP
  // step, so nothing they've already typed is ever lost.
  const [sharedPhone, setSharedPhone] = useState("");
  const [registerDraft, setRegisterDraft] = useState<{
    phone?: string;
    first_name?: string;
    last_name?: string;
    gender?: "male" | "female";
  }>({});

  const handleOtpSent = (context: PendingOtpContext, seconds?: number) => {
    setPending(context);
    setResendSeconds(seconds);
    setStep("otp");
  };

  const handleBackFromOtp = () => {
    setStep("form");
    setPending(null);
  };

  const handleTabChange = (next: AuthTab) => {
    setTab(next);
    setStep("form");
    setPending(null);
  };

  return (
    <div
      className={cn(
        "relative w-full max-w-sm overflow-hidden rounded-[2rem] p-6 sm:p-8",
        "border border-white/30 dark:border-white/10",
        "bg-[hsl(var(--card-glass)/var(--card-glass-alpha))]",
        "backdrop-blur-2xl backdrop-saturate-150",
        "shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.35)]",
        "dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]",
        className,
      )}
      dir="rtl"
    >
      {/* liquid-glass sheen: نور مورب و ملایم روی سطح شیشه */}
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/25 via-white/5 to-transparent dark:from-white/10 dark:via-white/0" />

      <div className="relative z-10">
        {step === "form" && (
          <>
            <div className="mx-auto mb-6 flex w-fit rounded-full bg-muted/70 p-1">
              <TabButton
                active={tab === "register"}
                onClick={() => handleTabChange("register")}
              >
                ثبت نام
              </TabButton>
              <TabButton
                active={tab === "login"}
                onClick={() => handleTabChange("login")}
              >
                ورود
              </TabButton>
            </div>

            {tab === "register" ? (
              <RegisterForm
                onOtpSent={handleOtpSent}
                onBack={onExit}
                initialValues={{ ...registerDraft, phone: registerDraft.phone ?? sharedPhone }}
                onDraftChange={(draft) => {
                  setRegisterDraft(draft);
                  if (draft.phone) setSharedPhone(draft.phone);
                }}
              />
            ) : (
              <LoginForm
                onOtpSent={handleOtpSent}
                onBack={onExit}
                initialPhone={sharedPhone}
                onPhoneChange={setSharedPhone}
              />
            )}

            {storesHref && (
              <Link
                href={storesHref}
                className="mt-6 block text-center text-sm font-medium text-foreground hover:text-primary"
              >
                فروشگاه‌ها
              </Link>
            )}
          </>
        )}

        {step === "otp" && pending && (
          <OtpStep
            context={pending}
            initialResendSeconds={resendSeconds}
            onVerified={onAuthenticated}
            onBack={handleBackFromOtp}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-6 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
