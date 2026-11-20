"use client";

import * as React from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { SuggestedShops } from "./suggested-shops";
import "./home.css";

interface Props<T> {
    items: T[];
    getKey: (item: T) => string | number;
    renderItem: (item: T, index: number) => React.ReactNode;
    skeleton: React.ReactNode;
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    emptyText: string;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: () => void;
    /** بعد از چندمین آیتم، فروشگاه‌های پیشنهادی نمایش داده شود (۰ = هیچ‌وقت) */
    suggestAfter?: number;
    /** وقتی تب پنهان است، مشاهده‌گر اسکرول بی‌نهایت غیرفعال می‌شود */
    active?: boolean;
}

/** لیست عمومی با اسکرول بی‌نهایت؛ برای هر دو تب استفاده می‌شود */
export function FeedList<T>({
                                items = [],
                                getKey,
                                renderItem,
                                skeleton,
                                isLoading,
                                isError,
                                onRetry,
                                emptyText,
                                hasNextPage = false,
                                isFetchingNextPage = false,
                                fetchNextPage,
                                suggestAfter = 0,
                                active = true,
                            }: Props<T>) {
    const sentinel = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const el = sentinel.current;
        if (!active || !el || !hasNextPage || isFetchingNextPage || !fetchNextPage) return;
        const io = new IntersectionObserver(([e]) => e.isIntersecting && fetchNextPage(), { rootMargin: "700px" });
        io.observe(el);
        return () => io.disconnect();
    }, [active, hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading) return <>{skeleton}</>;

    if (isError) {
        return (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-sm">
                <p className="text-[color:var(--hm-text-muted)]">دریافت اطلاعات ناموفق بود.</p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="h-10 rounded-full border border-[color:var(--hm-brand)] px-5 text-[color:var(--hm-brand)] active:bg-[color:var(--hm-brand-soft)]"
                >
                    تلاش دوباره
                </button>
            </div>
        );
    }

    // ایمن‌سازی در برابر مقادیر undefined یا null
    const safeItems = items ?? [];

    if (safeItems.length === 0) {
        return (
            <>
                <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                    <ImageOff className="size-10 text-[color:var(--hm-text-faint)]" />
                    <p className="text-sm text-[color:var(--hm-text-muted)]">{emptyText}</p>
                </div>
                <SuggestedShops />
            </>
        );
    }

    return (
        <div>
            {safeItems.map((item, i) => (
                <React.Fragment key={getKey(item)}>
                    {renderItem(item, i)}
                    {suggestAfter > 0 && i === suggestAfter - 1 && <SuggestedShops />}
                </React.Fragment>
            ))}
            <div ref={sentinel} className="flex h-16 items-center justify-center">
                {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-[color:var(--hm-text-faint)]" />}
            </div>
        </div>
    );
}