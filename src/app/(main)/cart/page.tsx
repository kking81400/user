"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Ellipsis, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart, useCartActions } from "@/hooks/use-cart";
import { CartItemCard, CartSkeleton } from "@/components/cart/cart-item-card";
import { CartSummary } from "@/components/cart/cart-summary";
import type { CartItem } from "@/types/cart";
import "@/components/home/home.css";

/** صفحه‌ی سبد خرید؛ موبایل‌فرست با عرض ثابت 448px (max-w-md) */
export default function CartPage() {
    const router = useRouter();
    const { data: cart, isLoading, isError, refetch } = useCart();
    const { setQuantity, remove } = useCartActions();
    const { mutate: mutateQty } = setQuantity;
    const { mutate: mutateRemove } = remove;

    const onQuantity = React.useCallback((i: CartItem, quantity: number) => mutateQty({ id: i.id, quantity }), [mutateQty]);
    const onRemove = React.useCallback((i: CartItem) => mutateRemove({ id: i.id, quantity: i.quantity }), [mutateRemove]);

    const hasItems = !!cart && cart.items.length > 0;

    return (
        <main className="mx-auto min-h-dvh w-full max-w-md bg-[color:var(--hm-bg)] text-[color:var(--hm-text)]">
            <header dir="ltr" className="sticky top-0 z-10 flex items-center justify-between bg-[color:var(--hm-glass)] px-5 py-4 backdrop-blur-md">
                <button
                    type="button"
                    aria-label="گزینه‌ها"
                    onClick={() => toast.info("گزینه‌های بیشتر به‌زودی فعال می‌شود")}
                    className="flex size-9 items-center justify-center"
                >
                    <Ellipsis className="size-6" />
                </button>
                <h1 className="text-xl font-extrabold">سبد خرید</h1>
                <button type="button" aria-label="بازگشت" onClick={() => router.back()} className="flex size-9 items-center justify-center">
                    <ArrowRight className="size-6 -scale-x-100" />
                </button>
            </header>

            <section className={hasItems ? "space-y-4 px-5 pb-[calc(20rem+var(--bottom-nav-h,64px))] pt-2" : "px-5 pt-2"}>
                {isLoading ? (
                    <CartSkeleton />
                ) : isError ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-center text-sm">
                        <p className="text-[color:var(--hm-text-muted)]">دریافت سبد خرید ناموفق بود.</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="h-10 rounded-full border border-[color:var(--hm-brand)] px-5 text-[color:var(--hm-brand)]"
                        >
                            تلاش دوباره
                        </button>
                    </div>
                ) : !hasItems ? (
                    <div className="flex flex-col items-center gap-4 py-24 text-center">
                        <ShoppingBag className="size-12 text-[color:var(--hm-text-faint)]" />
                        <p className="text-sm text-[color:var(--hm-text-muted)]">سبد خرید شما خالی است.</p>
                        <Link href="/" className="rounded-full bg-[color:var(--hm-brand)] px-6 py-2.5 text-sm font-bold text-[color:var(--hm-on-brand)]">
                            مشاهده محصولات
                        </Link>
                    </div>
                ) : (
                    cart.items.map((item) => <CartItemCard key={item.id} item={item} onQuantity={onQuantity} onRemove={onRemove} />)
                )}
            </section>

            {hasItems && <CartSummary cart={cart} onCheckout={() => router.push("/checkout")} />}
        </main>
    );
}