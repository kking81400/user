"use client";

import { ArrowLeft } from "lucide-react";
import type { Cart } from "@/types/cart";
import "@/components/home/home.css";

const fmt = (n: number) => n.toLocaleString("en-US");

/** پنل پایین سبد: قیمت کل، تخفیف، مبلغ قابل پرداخت و دکمه‌ی تکمیل خرید */
export function CartSummary({ cart, onCheckout }: { cart: Cart; onCheckout: () => void }) {
    return (
        <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-h,64px)+env(safe-area-inset-bottom))] z-20 mx-auto w-full max-w-md rounded-t-[32px] bg-[color:var(--hm-surface)] px-6 pb-5 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
            <dl className="space-y-3 text-sm text-[color:var(--hm-text-muted)]">
                <div className="flex items-center justify-between">
                    <dt>قیمت کل</dt>
                    <dd dir="ltr">{fmt(cart.total)}</dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt>تخفیف</dt>
                    <dd dir="ltr">{fmt(cart.discount)}</dd>
                </div>
            </dl>

            <div className="my-4 h-px bg-[color:var(--hm-border)]" />

            <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[color:var(--hm-text)]">مبلغ قابل پرداخت</span>
                <span className="flex items-baseline gap-1.5">
          <span className="text-xs text-[color:var(--hm-text-muted)]">تومان</span>
          <span className="text-2xl font-extrabold text-[color:var(--hm-text)]">{fmt(cart.payable)}</span>
        </span>
            </div>

            <button
                type="button"
                onClick={onCheckout}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-3xl bg-[color:var(--hm-brand)] text-base font-bold text-[color:var(--hm-on-brand)] shadow-lg shadow-[color:var(--hm-brand-soft)] transition-colors active:bg-[color:var(--hm-brand-hover)]"
            >
                <ArrowLeft className="size-5" />
                تکمیل خرید
            </button>
        </div>
    );
}