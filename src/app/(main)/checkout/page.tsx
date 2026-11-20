"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { useAddresses } from "@/hooks/use-addresses";
import { useSubmitOrder } from "@/hooks/use-orders";
import { readSubmitResult, type PaymentMethod } from "@/lib/api/orders";
import { AddressPicker, pickAddress } from "@/components/checkout/address-picker";
import { PaymentOptions, ShippingOption } from "@/components/checkout/checkout-options";
import "@/components/home/home.css";

const fmt = (n: number) => n.toLocaleString("en-US");

/** صفحه‌ی ثبت سفارش؛ موبایل‌فرست با عرض 448px */
export default function CheckoutPage() {
    const router = useRouter();
    const { data: cart, isLoading: cartLoading } = useCart();
    const { data: addresses } = useAddresses();
    const submit = useSubmitOrder();

    const [addressId, setAddressId] = React.useState<number | null>(null);
    const [payment, setPayment] = React.useState<PaymentMethod>("online");

    const address = pickAddress(addresses, addressId);
    const empty = !cartLoading && (!cart || cart.items.length === 0);
    const canSubmit = !!address && !!cart && cart.items.length > 0 && !submit.isPending;

    const onSubmit = () => {
        if (!address) return toast.error("ابتدا یک آدرس انتخاب کنید");
        submit.mutate(
            { address_id: address.id, payment_method: payment, shipping_method: "post" },
            {
                onSuccess: (raw) => {
                    const { paymentUrl, orderNumber } = readSubmitResult(raw);
                    if (paymentUrl) {
                        window.location.href = paymentUrl; // رفتن به درگاه پرداخت
                        return;
                    }
                    toast.success("سفارش شما ثبت شد");
                    router.replace(orderNumber ? `/orders/${orderNumber}` : "/orders");
                },
            }
        );
    };

    return (
        <main className="mx-auto min-h-dvh w-full max-w-md bg-[color:var(--hm-bg)] text-[color:var(--hm-text)]">
            <header dir="ltr" className="sticky top-0 z-10 flex items-center justify-between bg-[color:var(--hm-glass)] px-5 py-4 backdrop-blur-md">
                <span className="size-9" />
                <h1 className="text-xl font-extrabold">ثبت سفارش</h1>
                <button type="button" aria-label="بازگشت" onClick={() => router.back()} className="flex size-9 items-center justify-center">
                    <ArrowRight className="size-6 -scale-x-100" />
                </button>
            </header>

            {empty ? (
                <div className="flex flex-col items-center gap-4 px-5 py-24 text-center">
                    <p className="text-sm text-[color:var(--hm-text-muted)]">سبد خرید شما خالی است.</p>
                    <Link href="/cart" className="rounded-full bg-[color:var(--hm-brand)] px-6 py-2.5 text-sm font-bold text-[color:var(--hm-on-brand)]">
                        بازگشت به سبد خرید
                    </Link>
                </div>
            ) : (
                <div className="space-y-8 px-5 pb-[calc(15rem+var(--bottom-nav-h,64px))] pt-3">
                    <AddressPicker selectedId={addressId} onSelect={setAddressId} />
                    <ShippingOption />
                    <PaymentOptions value={payment} onChange={setPayment} />
                </div>
            )}

            {!empty && (
                <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-h,64px)+env(safe-area-inset-bottom))] z-20 mx-auto w-full max-w-md rounded-t-[32px] bg-[color:var(--hm-surface)] px-6 pb-5 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-[color:var(--hm-text-muted)]">مبلغ قابل پرداخت</span>
                        <span className="flex items-baseline gap-1.5">
              <span className="text-xs text-[color:var(--hm-text-muted)]">تومان</span>
              <span className="text-2xl font-extrabold">{cart ? fmt(cart.payable) : "—"}</span>
            </span>
                    </div>
                    <button
                        type="button"
                        disabled={!canSubmit}
                        onClick={onSubmit}
                        className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-3xl bg-[color:var(--hm-brand)] text-base font-bold text-[color:var(--hm-on-brand)] shadow-lg shadow-[color:var(--hm-brand-soft)] transition-colors active:bg-[color:var(--hm-brand-hover)] disabled:opacity-50"
                    >
                        {submit.isPending ? <Loader2 className="size-5 animate-spin" /> : <ArrowLeft className="size-5" />}
                        {submit.isPending ? "در حال ثبت..." : "ثبت نهایی و پرداخت"}
                    </button>
                </div>
            )}
        </main>
    );
}