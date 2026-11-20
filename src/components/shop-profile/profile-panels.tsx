// src/components/shop-profile/profile-panels.tsx
"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, Star } from "lucide-react";
import { LoadMoreSentinel } from "@/components/shop/load-more-sentinel";
import { shopReelHref } from "@/components/shop-profile/shop-link";
import {
    useCollectionProducts,
    useShopCollections,
    useShopProfileProducts,
    useShopReels,
    useShopReviews,
} from "@/hooks/use-shop-profile";
import { cn } from "@/lib/utils";
import type { ShopProduct } from "@/types/shop";
import type { ShopCollection, ShopReview } from "@/types/shop-profile";

const compact = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });


/* ---------- shared bits ---------- */

function Img({ src, alt, priority }: { src: string | null; alt: string; priority?: boolean }) {
    if (!src) return null;
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            className="absolute inset-0 size-full object-cover"
        />
    );
}

function GridSkeleton({ ratio = "aspect-[3/4]", count = 9, cols = "grid-cols-3" }: { ratio?: string; count?: number; cols?: string }) {
    return (
        <div className={cn("grid gap-0.5", cols)} aria-hidden>
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className={cn("animate-pulse bg-muted", ratio)} />
            ))}
        </div>
    );
}

function Message({ text, onRetry }: { text: string; onRetry?: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-sm text-muted-foreground">
            <p>{text}</p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground"
                >
                    تلاش مجدد
                </button>
            )}
        </div>
    );
}

/* ---------- products ---------- */

const ProductTile = memo(function ProductTile({ product, priority }: { product: ShopProduct; priority: boolean }) {
    return (
        <Link
            href={`/shop/${product.id}`}
            aria-label={product.title}
            className="relative block aspect-[3/4] overflow-hidden bg-muted active:opacity-80"
        >
            <Img src={product.image} alt={product.title} priority={priority} />
        </Link>
    );
});

const ProductGrid = memo(function ProductGrid({ items }: { items: ShopProduct[] }) {
    return (
        <div className="grid grid-cols-3 gap-0.5">
            {items.map((p, i) => (
                <ProductTile key={p.id} product={p} priority={i < 6} />
            ))}
        </div>
    );
});

export function ProductsPanel({ shopId }: { shopId: number }) {
    const q = useShopProfileProducts(shopId);
    const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);

    if (q.isPending) return <GridSkeleton />;
    if (q.isError) return <Message text="خطا در دریافت محصولات" onRetry={() => q.refetch()} />;
    if (!items.length) return <Message text="هنوز محصولی ثبت نشده" />;

    return (
        <>
            <ProductGrid items={items} />
            <LoadMoreSentinel
                disabled={!q.hasNextPage}
                onVisible={() => {
                    if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
                }}
            />
            {q.isFetchingNextPage && <div className="mt-0.5"><GridSkeleton count={3} /></div>}
        </>
    );
}

/* ---------- reels ---------- */

export function ReelsPanel({ shopId, shopName }: { shopId: number; shopName: string }) {
    const q = useShopReels(shopId);
    const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);

    if (q.isPending) return <GridSkeleton ratio="aspect-[9/16]" count={6} />;
    if (q.isError) return <Message text="خطا در دریافت ریلزها" onRetry={() => q.refetch()} />;
    if (!items.length) return <Message text="هنوز ریلزی منتشر نشده" />;

    return (
        <>
            <div className="grid grid-cols-3 gap-0.5">
                {items.map((reel, i) => (
                    <Link
                        key={reel.id}
                        href={shopReelHref(shopName, reel.id)}
                        aria-label="مشاهده ریلز"
                        className="relative block aspect-[9/16] overflow-hidden bg-muted active:opacity-80"
                    >
                        <Img src={reel.cover} alt="" priority={i < 6} />
                        <span className="absolute bottom-1.5 start-1.5 flex items-center gap-1 text-xs font-medium text-white drop-shadow">
              <Play className="size-3.5 fill-white" aria-hidden />
                            {reel.views !== null && compact.format(reel.views)}
            </span>
                    </Link>
                ))}
            </div>
            <LoadMoreSentinel
                disabled={!q.hasNextPage}
                onVisible={() => {
                    if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
                }}
            />
            {q.isFetchingNextPage && <div className="mt-0.5"><GridSkeleton ratio="aspect-[9/16]" count={3} /></div>}
        </>
    );
}

/* ---------- collections ---------- */

const CollectionCard = memo(function CollectionCard({
                                                        collection,
                                                        onOpen,
                                                    }: {
    collection: ShopCollection;
    onOpen: (c: ShopCollection) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onOpen(collection)}
            className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted text-start active:opacity-90"
        >
            <Img src={collection.cover} alt="" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute inset-x-4 bottom-3 text-white">
        <span className="block text-lg font-bold leading-6 drop-shadow">{collection.name}</span>
                {collection.productsCount !== null && (
                    <span className="block text-xs text-white/80">
            {collection.productsCount.toLocaleString("fa-IR")} محصول
          </span>
                )}
      </span>
        </button>
    );
});

function CollectionProducts({
                                shopId,
                                collection,
                                onBack,
                            }: {
    shopId: number;
    collection: ShopCollection;
    onBack: () => void;
}) {
    const q = useCollectionProducts(shopId, collection.id);

    return (
        <div>
            <div className="flex items-center gap-2 px-4 py-3">
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="بازگشت به کالکشن‌ها"
                    className="grid size-9 place-items-center rounded-full text-foreground active:bg-muted"
                >
                    <ArrowRight className="size-5" />
                </button>
                <h3 className="truncate text-base font-bold text-foreground">{collection.name}</h3>
            </div>
            {q.isPending ? (
                <GridSkeleton />
            ) : q.isError ? (
                <Message text="خطا در دریافت محصولات" onRetry={() => q.refetch()} />
            ) : !q.data.items.length ? (
                <Message text="این کالکشن هنوز محصولی ندارد" />
            ) : (
                <ProductGrid items={q.data.items} />
            )}
        </div>
    );
}

export function CollectionsPanel({ shopId }: { shopId: number }) {
    const q = useShopCollections(shopId);
    const [open, setOpen] = useState<ShopCollection | null>(null);

    if (open) return <CollectionProducts shopId={shopId} collection={open} onBack={() => setOpen(null)} />;

    if (q.isPending) return <div className="px-4 pt-4"><GridSkeleton ratio="aspect-[4/5]" count={4} cols="grid-cols-2 gap-3" /></div>;
    if (q.isError) return <Message text="خطا در دریافت کالکشن‌ها" onRetry={() => q.refetch()} />;
    if (!q.data.length) return <Message text="هنوز کالکشنی ساخته نشده" />;

    return (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
            {q.data.map((c) => (
                <CollectionCard key={c.id} collection={c} onOpen={setOpen} />
            ))}
        </div>
    );
}

/* ---------- reviews ---------- */

const dateFmt = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" });
function formatDate(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : dateFmt.format(d);
}

const ReviewItem = memo(function ReviewItem({ review }: { review: ShopReview }) {
    const date = formatDate(review.date);
    return (
        <li className="flex gap-3 border-b border-border py-4 last:border-b-0">
      <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
        {review.avatar ? (
            <Img src={review.avatar} alt="" />
        ) : (
            <span className="grid size-full place-items-center text-sm font-bold text-muted-foreground">
            {review.author.charAt(0)}
          </span>
        )}
      </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{review.author}</span>
                    {date && <span className="shrink-0 text-[11px] text-muted-foreground">{date}</span>}
                </div>
                {review.rating !== null && (
                    <div className="mt-1 flex gap-0.5" role="img" aria-label={`امتیاز ${review.rating} از ۵`}>
                        {Array.from({ length: 5 }, (_, i) => (
                            <Star
                                key={i}
                                className={cn("size-3.5", i < Math.round(review.rating!) ? "fill-primary text-primary" : "text-border")}
                            />
                        ))}
                    </div>
                )}
                {review.text && <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{review.text}</p>}
            </div>
        </li>
    );
});

export function ReviewsPanel({ shopId }: { shopId: number }) {
    const q = useShopReviews(shopId);

    if (q.isPending) {
        return (
            <div className="space-y-4 px-4 pt-4" aria-hidden>
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
                ))}
            </div>
        );
    }
    if (q.isError) return <Message text="خطا در دریافت نظرات" onRetry={() => q.refetch()} />;
    if (!q.data.length) return <Message text="هنوز نظری ثبت نشده" />;

    return (
        <ul className="px-4">
            {q.data.map((r) => (
                <ReviewItem key={r.id} review={r} />
            ))}
        </ul>
    );
}