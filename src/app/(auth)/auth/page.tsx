"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthCard } from "@/components/auth/auth-card";
import { useAuthStore } from "@/store/auth-store";

// عکس واقعی طرح (دیوار آجری + مدل) رو اینجا بذار
const HERO_IMAGE = "/images/auth-hero.jpg";

export default function AuthPage() {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  // یه کاربر لاگین‌شده نباید اصلاً صفحهٔ ورود/ثبت‌نام رو ببینه.
  useEffect(() => {
    if (hasHydrated && accessToken) {
      router.replace("/");
    }
  }, [hasHydrated, accessToken, router]);

  const handleAuthenticated = () => {
    router.replace("/");
  };

  const handleExit = () => {
    router.back();
  };

  // تا وقتی مشخص نشده کاربر از قبل لاگینه یا نه (خوندن کوکی)، چیزی نشون
  // نده تا فرم لاگین یه لحظه چشمک نزنه و بعد ریدایرکت بشه.
  if (!hasHydrated || accessToken) {
    return null;
  }

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-gradient-to-b from-neutral-800 to-neutral-950 lg:flex">
      {/* توجه: دکمهٔ تغییر تم عمداً از این صفحه حذف شده — دارک/لایت پیش‌فرض
          طبق تنظیمات سیستم کاربره (ThemeProvider با defaultTheme="system")
          و سوییچ دستی‌اش باید جای دیگه‌ای توی اپ (مثلاً پروفایل) باشه. */}

      {/* ---- Desktop: پنل عکس سمت چپ ---- */}
      <div className="relative hidden lg:block lg:w-1/2 xl:w-3/5">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="60vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* ---- Mobile: عکس تمام‌صفحه پشت کارت شیشه‌ای ---- */}
      <div className="absolute inset-0 lg:hidden">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* ---- کارت: همیشه وسط صفحه (هم موبایل هم دسکتاپ) ---- */}
      <div className="relative z-10 flex min-h-dvh w-full items-center justify-center p-4 lg:w-1/2 lg:p-12 xl:w-2/5">
        <AuthCard
          onAuthenticated={handleAuthenticated}
          onExit={handleExit}
          storesHref="/stores"
          defaultTab="register"
        />
      </div>
    </main>
  );
}
