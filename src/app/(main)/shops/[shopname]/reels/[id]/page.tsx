// src/app/(main)/shops/[shopname]/reels/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import ReelPlayerFeed from "@/components/home/reel-player-feed";
import CommentsModal from "@/components/home/comments-modal";
import ProductsModal from "@/components/home/products-modal";
import QuickViewModal from "@/components/home/quick-view-modal";
import { useShopProfile, useShopReels } from "@/hooks/use-shop-profile";

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

const Screen = ({ children }: { children: React.ReactNode }) => (
    <div className="flex h-[calc(100dvh-4rem)] w-full items-center justify-center bg-black text-sm text-white">
        {children}
    </div>
);

/**
 * Full-screen viewer for the reels of ONE shop. Same player, comments, products and quick-view
 * as /reels/[id]; the only difference is the data source (shop reels instead of the explore feed).
 */
export default function ShopReelPage({ params }: { params: { shopname: string; id: string } }) {
    const router = useRouter();
    const shopName = safeDecode(params.shopname);
    const reelId = Number(params.id);

    const [activeCommentsReelId, setActiveCommentsReelId] = useState<number | null>(null);
    const [activeProductsReelId, setActiveProductsReelId] = useState<number | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

    // the profile is normally already cached from the profile page
    const { data: shop, isPending: shopPending } = useShopProfile(shopName);
    const reels = useShopReels(shop?.id ?? 0);
    const { hasNextPage, isFetchingNextPage, fetchNextPage } = reels;

    const all = useMemo(() => reels.data?.pages.flatMap((p) => p.items) ?? [], [reels.data]);
    const startIndex = all.findIndex((r) => r.id === reelId);

    // opened via a direct link: keep loading pages until the requested reel shows up
    useEffect(() => {
        if (startIndex === -1 && hasNextPage && !isFetchingNextPage) void fetchNextPage();
    }, [startIndex, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // clicked reel first, then the rest of the shop's reels, in the shape the player already expects
    const feedItems = useMemo(() => {
        if (!shop || startIndex === -1) return [];
        const ordered = [...all.slice(startIndex), ...all.slice(0, startIndex)];
        return ordered
            .filter((r) => r.videoUrl)
            .map((r) => ({
                reel_id: r.id,
                video_url: r.videoUrl,
                cover_url: r.cover,
                caption: "", // not in the shop reels response yet
                interactions: {
                    likes_count: r.likes ?? 0,
                    comments_count: 0, // not in the shop reels response yet
                    views_count: r.views ?? 0,
                    is_liked: false, // not in the shop reels response yet
                    is_saved: false,
                },
                shop: {
                    shop_id: shop.id,
                    user_name: shop.name,
                    profile_image: shop.avatar ?? "",
                    is_followed: shop.isFollowed,
                },
            }));
    }, [all, shop, startIndex]);

    if (!Number.isInteger(reelId) || reelId <= 0) return <Screen>شناسه ریلز نامعتبر است</Screen>;
    if (shopPending || reels.isPending) return <Screen>در حال بارگذاری ویدیوها...</Screen>;
    if (!shop || reels.isError) return <Screen>خطا در دریافت ویدیوها</Screen>;
    if (startIndex === -1 && !hasNextPage) return <Screen>این ریلز پیدا نشد</Screen>;
    if (startIndex === -1) return <Screen>در حال بارگذاری ویدیوها...</Screen>;

    return (
        <div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden bg-black">
            <button
                type="button"
                onClick={() => router.back()}
                aria-label="بستن"
                className="absolute right-4 top-4 z-40 cursor-pointer rounded-full bg-black/40 p-2 text-white backdrop-blur-md"
            >
                <X className="h-5 w-5" />
            </button>

            {feedItems.length > 0 ? (
                <ReelPlayerFeed
                    initialReels={feedItems}
                    currentIndex={0}
                    onOpenComments={setActiveCommentsReelId}
                    onOpenProducts={setActiveProductsReelId}
                    onLoadMore={() => {
                        if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
                    }}
                    hasMore={!!hasNextPage}
                />
            ) : (
                <Screen>ویدیویی برای نمایش وجود ندارد</Screen>
            )}

            <CommentsModal
                isOpen={!!activeCommentsReelId}
                onClose={() => setActiveCommentsReelId(null)}
                reelId={activeCommentsReelId || reelId}
            />
            <ProductsModal
                isOpen={!!activeProductsReelId}
                onClose={() => setActiveProductsReelId(null)}
                reelId={activeProductsReelId || reelId}
                onSelectProduct={(id) => setSelectedProductId(id)}
            />
            <QuickViewModal productId={selectedProductId} onClose={() => setSelectedProductId(null)} />
        </div>
    );
}