// src/app/(main)/shops/[shopname]/page.tsx
"use client";

import { useCallback, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/shop-profile/profile-header";
import { ProfileHighlights } from "@/components/shop-profile/profile-highlights";
import {
    CollectionsPanel,
    ProductsPanel,
    ReelsPanel,
    ReviewsPanel,
} from "@/components/shop-profile/profile-panels";
import { ProfileTabs, type ProfileTabId } from "@/components/shop-profile/profile-tabs";
import { useShopProfile } from "@/hooks/use-shop-profile";

/** Remembers the last open tab per shop while the app stays open (back navigation lands on the same tab). */
const lastTab = new Map<string, ProfileTabId>();

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export default function ShopProfilePage({ params }: { params: { shopname: string } }) {
    const shopname = safeDecode(params.shopname);
    const router = useRouter();
    const { data: shop, isPending, isError, error, refetch } = useShopProfile(shopname);

    const [tab, setTab] = useState<ProfileTabId>(() => lastTab.get(shopname) ?? "products");
    const changeTab = useCallback(
        (next: ProfileTabId) => {
            lastTab.set(shopname, next);
            setTab(next);
        },
        [shopname],
    );

    if (!shopname) notFound();

    if (isPending) return <ProfileSkeleton />;

    if (isError || !shop) {
        const notFoundErr = (error as { response?: { status?: number } } | null)?.response?.status === 404;
        return (
            <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-sm text-muted-foreground">
                <p>{notFoundErr ? "این فروشگاه پیدا نشد" : "خطا در دریافت اطلاعات فروشگاه"}</p>
                <div className="flex gap-2">
                    {!notFoundErr && (
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground"
                        >
                            تلاش مجدد
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-full bg-muted px-5 py-2 text-xs font-medium text-foreground"
                    >
                        بازگشت
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh bg-background pb-28">
            <ProfileHeader shop={shop} />
            <ProfileHighlights items={shop.highlights} />

            <div className="mt-5">
                <ProfileTabs active={tab} onChange={changeTab} />
                {/* key → switching tabs remounts only the panel; data stays cached by React Query */}
                <div id="profile-panel" role="tabpanel" aria-labelledby={`profile-tab-${tab}`} key={tab}>
                    {tab === "products" && <ProductsPanel shopId={shop.id} />}
                    {tab === "reels" && <ReelsPanel shopId={shop.id} shopName={shopname} />}
                    {tab === "collections" && <CollectionsPanel shopId={shop.id} />}
                    {tab === "reviews" && <ReviewsPanel shopId={shop.id} />}
                </div>
            </div>
        </main>
    );
}

function ProfileSkeleton() {
    return (
        <main className="min-h-dvh bg-background" aria-hidden>
            <div className="h-14 border-b border-border" />
            <div className="px-4 pt-5">
                <div className="flex items-center gap-4">
                    <div className="size-20 animate-pulse rounded-full bg-muted" />
                    <div className="flex flex-1 justify-around">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-10 w-12 animate-pulse rounded-lg bg-muted" />
                        ))}
                    </div>
                </div>
                <div className="mt-4 h-5 w-1/2 animate-pulse rounded-full bg-muted" />
                <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-muted" />
                <div className="mt-4 flex gap-2.5">
                    <div className="h-10 flex-1 animate-pulse rounded-xl bg-muted" />
                    <div className="h-10 flex-1 animate-pulse rounded-xl bg-muted" />
                </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }, (_, i) => (
                    <div key={i} className="aspect-[3/4] animate-pulse bg-muted" />
                ))}
            </div>
        </main>
    );
}