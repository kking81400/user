// src/components/shop-profile/profile-header.tsx
"use client";

import { memo } from "react";
import { BadgeCheck, MapPin, Share2, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { MessageShopButton } from "@/components/chat/message-shop-button";
import { useProductToggle } from "@/hooks/use-product-detail";
import { setShopFollow } from "@/lib/api/product-detail";
import { cn } from "@/lib/utils";
import type { ShopProfile } from "@/types/shop-profile";

const compact = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });
const formatCount = (n: number | null) => (n === null ? "–" : compact.format(n));

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-1 text-lg font-bold text-foreground">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );
}

function ProfileHeaderImpl({ shop }: { shop: ShopProfile }) {
    const follow = useProductToggle(shop.isFollowed, (next) => setShopFollow(shop.id, next));

    // follower count reacts instantly to the optimistic follow state
    const followers =
        shop.followersCount === null
            ? null
            : shop.followersCount + (follow.active === shop.isFollowed ? 0 : follow.active ? 1 : -1);

    const share = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) await navigator.share({ title: shop.name, url });
            else {
                await navigator.clipboard.writeText(url);
                toast.success("لینک کپی شد");
            }
        } catch {
            /* cancelled */
        }
    };

    const websiteHref = shop.website
        ? /^https?:\/\//.test(shop.website)
            ? shop.website
            : `https://${shop.website}`
        : null;

    return (
        <div>
            <header className="flex h-14 items-center justify-between border-b border-border px-4">
                <h1 className="flex min-w-0 items-center gap-2 text-lg font-bold text-foreground">
                    {/* shop.username is a phone number in this backend, so the public handle is the shop name */}
                    <span className="truncate">{shop.name}</span>
                    {shop.verified && <BadgeCheck className="size-5 shrink-0 text-primary" aria-label="تأییدشده" />}
                </h1>
                <button
                    type="button"
                    onClick={share}
                    aria-label="اشتراک‌گذاری"
                    className="grid size-9 place-items-center rounded-full text-foreground active:bg-muted"
                >
                    <Share2 className="size-5" />
                </button>
            </header>

            <div className="px-4 pt-5">
                {/* avatar + stats */}
                <div className="flex items-center gap-4">
                    <div className="size-20 shrink-0 rounded-full border-2 border-primary p-0.5">
                        {shop.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={shop.avatar}
                                alt={shop.name}
                                decoding="async"
                                className="size-full rounded-full object-cover"
                            />
                        ) : (
                            <span className="grid size-full place-items-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
                {shop.name.charAt(0)}
              </span>
                        )}
                    </div>

                    <div className="flex flex-1 justify-around">
                        <Stat value={formatCount(shop.productsCount)} label="محصول" />
                        <Stat value={formatCount(followers)} label="دنبال‌کننده" />
                        <Stat
                            value={
                                shop.rating === null ? (
                                    "–"
                                ) : (
                                    <>
                                        <Star className="size-4 fill-primary text-primary" aria-hidden />
                                        {shop.rating.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}
                                    </>
                                )
                            }
                            label="امتیاز"
                        />
                    </div>
                </div>

                {/* name + bio */}
                <div className="mt-4 space-y-1.5">
                    {shop.slogan && <h2 className="text-base font-bold text-foreground">{shop.slogan}</h2>}
                    {shop.bio && (
                        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
                            <span className="whitespace-pre-line">{shop.bio}</span>
                        </p>
                    )}
                    {shop.location && (
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="size-4 shrink-0" aria-hidden />
                            {shop.location}
                        </p>
                    )}
                    {websiteHref && (
                        <a
                            href={websiteHref}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            dir="ltr"
                            className="block truncate text-start text-sm text-primary"
                        >
                            {shop.website}
                        </a>
                    )}
                </div>

                {/* actions */}
                <div className="mt-4 flex gap-2.5">
                    <button
                        type="button"
                        onClick={follow.toggle}
                        aria-pressed={follow.active}
                        className={cn(
                            "h-10 flex-1 rounded-xl text-sm font-medium transition-colors active:opacity-80",
                            follow.active
                                ? "border border-border bg-background text-foreground"
                                : "bg-primary text-primary-foreground",
                        )}
                    >
                        {follow.active ? "دنبال می‌کنید" : "دنبال کردن"}
                    </button>
                    <MessageShopButton shopName={shop.name} />
                </div>
            </div>
        </div>
    );
}

export const ProfileHeader = memo(ProfileHeaderImpl);