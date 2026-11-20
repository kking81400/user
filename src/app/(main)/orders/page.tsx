"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, PackageOpen } from "lucide-react";
import { useOrders } from "@/hooks/use-orders";
import { OrderCard, OrdersSkeleton } from "@/components/orders/order-ui";
import { cn } from "@/lib/utils";
import "@/components/home/home.css";

/** مقدار tab مطابق API؛ اگر بک‌اند اسم دیگری دارد فقط همین‌جا عوض کنید */
const TABS = [
    { key: "", label: "همه" },
    { key: "active", label: "در جریان" },
    { key: "delivered", label: "تحویل شده" },
    { key: "returned", label: "مرجوعی" },
];

function OrdersView() {
    const router = useRouter();
    const params = useSearchParams();
    const [tab, setTab] = React.useState(params.get("tab") ?? "");
    const q = useOrders(tab);

    const changeTab = (key: string) => {
        setTab(key);
        window.history.replaceState(null, "", key ? `/orders?tab=${key}` : "/orders");
    };

    const sentinel = React.useRef<HTMLDivElement>(null);
    const { hasNextPage, isFetchingNextPage, fetchNextPage } = q;
    React.useEffect(() => {
        const el = sentinel.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        const io = new IntersectionObserver(([e]) => e.isIntersecting && fetchNextPage(), { rootMargin: "500px" });
        io.observe(el);
        return () => io.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <main className="mx-auto min-h-dvh w-full max-w-md bg-[color:var(--hm-bg)] pb-28 text-[color:var(--hm-text)]">
            <header dir="ltr" className="sticky top-0 z-10 flex items-center justify-between bg-[color:var(--hm-glass)] px-5 py-4 backdrop-blur-md">
                <span className="size-9" />
                <h1 className="text-xl font-extrabold">سفارش‌های من</h1>
                <button type="button" aria-label="بازگشت" onClick={() => router.back()} className="flex size-9 items-center justify-center">
                    <ArrowRight className="size-6 -scale-x-100" />
                </button>
            </header>

            <div className="hm-no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => changeTab(t.key)}
                        className={cn(
                            "h-9 shrink-0 rounded-full px-4 text-sm transition-colors",
                            t.key === tab
                                ? "bg-[color:var(--hm-brand)] font-bold text-[color:var(--hm-on-brand)]"
                                : "bg-[color:var(--hm-muted)] text-[color:var(--hm-text-muted)]"
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <section className="space-y-4 px-5 pt-2">
                {q.isLoading ? (
                    <OrdersSkeleton />
                ) : q.isError ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-center text-sm">
                        <p className="text-[color:var(--hm-text-muted)]">دریافت سفارش‌ها ناموفق بود.</p>
                        <button type="button" onClick={() => q.refetch()} className="h-10 rounded-full border border-[color:var(--hm-brand)] px-5 text-[color:var(--hm-brand)]">
                            تلاش دوباره
                        </button>
                    </div>
                ) : q.items.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-24 text-center">
                        <PackageOpen className="size-12 text-[color:var(--hm-text-faint)]" />
                        <p className="text-sm text-[color:var(--hm-text-muted)]">سفارشی پیدا نشد.</p>
                        <Link href="/" className="rounded-full bg-[color:var(--hm-brand)] px-6 py-2.5 text-sm font-bold text-[color:var(--hm-on-brand)]">
                            مشاهده محصولات
                        </Link>
                    </div>
                ) : (
                    <>
                        {q.items.map((o) => (
                            <OrderCard key={o.id} order={o} />
                        ))}
                        <div ref={sentinel} className="flex h-12 items-center justify-center">
                            {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-[color:var(--hm-text-faint)]" />}
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}

export default function OrdersPage() {
    return (
        <React.Suspense fallback={null}>
            <OrdersView />
        </React.Suspense>
    );
}