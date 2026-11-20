"use client";

import { Check, CreditCard, Wallet } from "lucide-react";
import type { PaymentMethod } from "@/lib/api/orders";
import { cn } from "@/lib/utils";
import "@/components/home/home.css";

/** روش ارسال: فعلاً یک گزینه (پست)، رایگان */
export function ShippingOption() {
    return (
        <section>
            <h2 className="mb-3 text-lg font-extrabold text-[color:var(--hm-text)]">روش ارسال</h2>
            <div className="flex items-center justify-between rounded-[28px] border-2 border-[color:var(--hm-brand)] bg-[color:var(--hm-muted)] px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="size-6 rounded-full bg-[color:var(--hm-brand)]" aria-hidden />
                    <div>
                        <p className="font-extrabold text-[color:var(--hm-text)]">ارسال سریع</p>
                        <p className="text-xs text-[color:var(--hm-text-muted)]">تحویل ۱-۲ روز کاری</p>
                    </div>
                </div>
                <span className="text-sm font-bold text-green-600">رایگان</span>
            </div>
        </section>
    );
}

/** روش پرداخت: آنلاین فعال، کیف پول فعلاً غیرفعال */
export function PaymentOptions({
                                   value,
                                   onChange,
                               }: {
    value: PaymentMethod;
    onChange: (m: PaymentMethod) => void;
}) {
    const online = value === "online";
    return (
        <section>
            <h2 className="mb-3 text-lg font-extrabold text-[color:var(--hm-text)]">روش پرداخت</h2>
            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    aria-pressed={online}
                    onClick={() => onChange("online")}
                    className={cn(
                        "relative flex h-[130px] flex-col items-center justify-center gap-3 rounded-[28px] border-2 bg-[color:var(--hm-muted)] transition-colors",
                        online ? "border-[color:var(--hm-brand)]" : "border-transparent"
                    )}
                >
                    {online && (
                        <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-[color:var(--hm-brand)] text-[color:var(--hm-on-brand)]">
              <Check className="size-4" strokeWidth={3} />
            </span>
                    )}
                    <span className="flex size-14 items-center justify-center rounded-full bg-[color:var(--hm-brand-soft)] text-[color:var(--hm-text-muted)]">
            <CreditCard className="size-7" />
          </span>
                    <span className="text-sm font-bold text-[color:var(--hm-text)]">پرداخت آنلاین</span>
                </button>

                <button
                    type="button"
                    disabled
                    aria-disabled
                    title="به‌زودی"
                    className="flex h-[130px] cursor-not-allowed flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-transparent bg-[color:var(--hm-muted)] opacity-60"
                >
          <span className="flex size-14 items-center justify-center rounded-full bg-[color:var(--hm-border)] text-[color:var(--hm-text-muted)]">
            <Wallet className="size-7" />
          </span>
                    <span className="text-sm font-bold text-[color:var(--hm-text-muted)]">کیف پول</span>
                </button>
            </div>
        </section>
    );
}