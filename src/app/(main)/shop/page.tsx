// src/app/(main)/shop/page.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { LoadMoreSentinel } from "@/components/shop/load-more-sentinel";
import { ShopFilterSheet } from "@/components/shop/shop-filter-sheet";
import { ShopGrid, ShopGridSkeleton } from "@/components/shop/shop-grid";
import { ShopSearchBar } from "@/components/shop/shop-search-bar";
import { useShopProducts } from "@/hooks/use-shop";
import { cn } from "@/lib/utils";

export default function ShopPage() {
    // null = all products
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);

    const {
        data,
        isPending,
        isError,
        isPlaceholderData,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch,
    } = useShopProducts(categoryId);

    const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const closeFilter = useCallback(() => setFilterOpen(false), []);
    const applyFilter = useCallback((id: number | null) => {
        setCategoryId(id);
        setFilterOpen(false);
    }, []);

    return (
        <main className="min-h-dvh bg-background pb-28">
            <header className="sticky top-0 z-10 border-b border-border bg-background px-4 pb-3 pt-5">
                <ShopSearchBar />
            </header>

            <section className="px-4 pt-5" aria-live="polite">
                {isPending && !isError ? (
                    <ShopGridSkeleton />
                ) : isError ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
                        <p>خطا در دریافت محصولات</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground"
                        >
                            تلاش مجدد
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
                        <p>محصولی یافت نشد</p>
                        {categoryId !== null && (
                            <button
                                type="button"
                                onClick={() => setCategoryId(null)}
                                className="rounded-full bg-muted px-5 py-2 text-xs font-medium text-foreground"
                            >
                                حذف فیلتر
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={cn("transition-opacity", isPlaceholderData && "opacity-50")}>
                        <ShopGrid items={items} />
                        <LoadMoreSentinel onVisible={loadMore} disabled={!hasNextPage || isPlaceholderData} />
                        {isFetchingNextPage && (
                            <div className="mt-3">
                                <ShopGridSkeleton />
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* sits inside the mobile column (max-w-md), right above the bottom nav (bottom-24) */}
            <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 mx-auto flex w-full max-w-md px-4 pb-4">
                <button
                    type="button"
                    onClick={() => setFilterOpen(true)}
                    className="pointer-events-auto relative mr-auto flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg active:opacity-90"
                >
                    فیلترها
                    <SlidersHorizontal className="size-4" aria-hidden />
                    {categoryId !== null && (
                        <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-background bg-foreground" />
                    )}
                </button>
            </div>

            {filterOpen && (
                <ShopFilterSheet appliedId={categoryId} onApply={applyFilter} onClose={closeFilter} />
            )}
        </main>
    );
}