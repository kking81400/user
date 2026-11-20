// src/components/product/product-detail-view.tsx
"use client";

import { useRouter } from "next/navigation";
import { Archive, Bookmark, ChevronLeft, ChevronRight, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ProductGallery } from "@/components/product/product-gallery";
import { ShopLink } from "@/components/shop-profile/shop-link";
import { ColorPicker, SizePicker } from "@/components/product/product-options";
import { useProductToggle } from "@/hooks/use-product-detail";
import { useVariantSelection } from "@/hooks/use-variant-selection";
import { setProductBookmark, setProductLike, setShopFollow } from "@/lib/api/product-detail";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/types/product-detail";

const LOW_STOCK_THRESHOLD = 5;
const formatPrice = (n: number) => Math.round(n).toLocaleString("en-US");

export function ProductDetailView({ product }: { product: ProductDetail }) {
    const router = useRouter();
    const { color, size, variant, selectColor, selectSize, isSizeAvailable } =
        useVariantSelection(product);

    const like = useProductToggle(product.isLiked, (next) => setProductLike(product.id, next));
    const bookmark = useProductToggle(product.isSaved, (next) => setProductBookmark(product.id, next));
    const shopId = product.shop?.id;
    const follow = useProductToggle(product.shop?.isFollowed ?? false, (next) =>
        shopId === undefined ? Promise.resolve() : setShopFollow(shopId, next),
    );

    // price: discount_price (when present) is treated as the final price; variants add their adjustment
    const adjustment = variant?.priceAdjustment ?? 0;
    const finalPrice = (product.discountPrice ?? product.sellPrice) + adjustment;
    const oldPrice = product.discountPrice !== null ? product.sellPrice + adjustment : null;

    const stock = variant?.stock ?? 0;
    const canBuy = variant !== null && stock > 0;
    const lowStock = canBuy && stock <= LOW_STOCK_THRESHOLD;

    const share = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) await navigator.share({ title: product.name, url });
            else {
                await navigator.clipboard.writeText(url);
                toast.success("لینک کپی شد");
            }
        } catch {
            /* user cancelled */
        }
    };

    const handleAddToCart = () => {
        if (!variant) return;
        // TODO(cart): connect to the existing cart hook with variant.id (needs hooks/use-cart.ts)
        toast.info("اتصال به سبد خرید در مرحله بعد");
    };

    const openComments = () => {
        // TODO(comments): open the shared comments modal for product.id
        toast.info("اتصال نظرات در مرحله بعد");
    };

    return (
        <main className="min-h-dvh bg-background pb-28">
            {/* header */}
            <header className="sticky top-0 z-20 grid h-14 grid-cols-[1fr_auto_1fr] items-center bg-background px-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="بازگشت"
                    className="grid size-9 place-items-center justify-self-start rounded-full text-foreground active:bg-muted"
                >
                    <ChevronRight className="size-6" />
                </button>
                <h1 className="max-w-40 truncate text-base font-semibold text-foreground">
                    {product.category ?? product.shop?.name ?? ""}
                </h1>
                <div className="flex gap-1 justify-self-end">
                    <button
                        type="button"
                        onClick={share}
                        aria-label="اشتراک‌گذاری"
                        className="grid size-9 place-items-center rounded-full text-foreground active:bg-muted"
                    >
                        <Share2 className="size-5" />
                    </button>
                    <button
                        type="button"
                        onClick={bookmark.toggle}
                        aria-label={bookmark.active ? "حذف از ذخیره‌ها" : "ذخیره"}
                        aria-pressed={bookmark.active}
                        className="grid size-9 place-items-center rounded-full text-foreground active:bg-muted"
                    >
                        <Bookmark className={cn("size-5", bookmark.active && "fill-current")} />
                    </button>
                </div>
            </header>

            {/* gallery + shop badge */}
            <ProductGallery images={product.gallery} alt={product.name}>
                {product.shop && (
                    // pointer-events-none so the empty strip doesn't block swiping the gallery underneath
                    <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between gap-2">
                        <ShopLink
                            shopName={product.shop.name}
                            className="pointer-events-auto flex items-center gap-2 rounded-full bg-background/90 py-1 pe-1 ps-3 backdrop-blur active:opacity-80"
                        >
                            <span className="text-xs font-medium text-foreground">{product.shop.name}</span>
                            <ShopAvatar name={product.shop.name} src={product.shop.profileImage} />
                        </ShopLink>
                        <button
                            type="button"
                            onClick={follow.toggle}
                            aria-pressed={follow.active}
                            className={cn(
                                "pointer-events-auto rounded-full px-3.5 py-1.5 text-[11px] font-medium backdrop-blur transition-colors active:opacity-80",
                                follow.active
                                    ? "bg-background/90 text-muted-foreground"
                                    : "bg-primary text-primary-foreground",
                            )}
                        >
                            {follow.active ? "دنبال می‌کنید" : "دنبال کردن"}
                        </button>
                    </div>
                )}
            </ProductGallery>

            <div className="space-y-6 px-4 pt-5">
                {/* name + price */}
                <section>
                    <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg font-bold leading-7 text-foreground">{product.name}</h2>
                        <div className="shrink-0 text-end">
                            <p className="flex items-baseline gap-1.5">
                                <span className="text-lg font-bold text-primary">{formatPrice(finalPrice)}</span>
                                <span className="text-xs text-muted-foreground">ریال</span>
                            </p>
                            {oldPrice !== null && (
                                <p className="text-xs text-muted-foreground line-through">{formatPrice(oldPrice)}</p>
                            )}
                        </div>
                    </div>

                    {lowStock && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                            <Archive className="size-4" aria-hidden />
                            فقط {stock.toLocaleString("fa-IR")} عدد در انبار باقی مانده
                        </p>
                    )}
                    {variant !== null && stock === 0 && (
                        <p className="mt-2 text-xs text-destructive">این گزینه ناموجود است</p>
                    )}
                </section>

                <ColorPicker colors={product.colors} selected={color} onSelect={selectColor} />
                <SizePicker
                    sizes={product.sizes}
                    selected={size}
                    isAvailable={isSizeAvailable}
                    onSelect={selectSize}
                />

                {product.description && (
                    <section>
                        <h3 className="text-sm font-medium text-foreground">توضیحات محصول</h3>
                        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                            {product.description}
                        </p>
                    </section>
                )}

                <button
                    type="button"
                    onClick={openComments}
                    className="flex w-full items-center justify-between border-y border-border py-4 text-sm font-medium text-foreground"
                >
                    نظرات کاربران
                    <ChevronLeft className="size-4 text-muted-foreground" aria-hidden />
                </button>
            </div>

            {/* action bar: part of the page flow (not fixed), so it never floats away from the nav */}
            <div className="flex items-center gap-3 px-4 pt-6">
                <button
                    type="button"
                    onClick={like.toggle}
                    aria-label={like.active ? "برداشتن پسند" : "پسندیدن"}
                    aria-pressed={like.active}
                    className="grid size-14 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground active:opacity-80"
                >
                    <Heart className={cn("size-6", like.active && "fill-destructive text-destructive")} />
                </button>
                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!canBuy}
                    className="h-14 flex-1 rounded-full bg-primary text-base font-medium text-primary-foreground shadow-lg transition-opacity active:opacity-90 disabled:opacity-50"
                >
                    {variant === null ? "انتخاب گزینه" : stock === 0 ? "ناموجود" : "افزودن به سبد خرید"}
                </button>
            </div>
        </main>
    );
}

function ShopAvatar({ name, src }: { name: string; src: string | null }) {
    return src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-7 rounded-full object-cover" />
    ) : (
        <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
      {name.charAt(0)}
    </span>
    );
}

export function ProductDetailSkeleton() {
    return (
        <main className="min-h-dvh bg-background" aria-hidden>
            <div className="h-14" />
            <div className="aspect-[5/7] w-full animate-pulse bg-muted" />
            <div className="space-y-4 px-4 pt-5">
                <div className="h-6 w-2/3 animate-pulse rounded-full bg-muted" />
                <div className="h-5 w-1/3 animate-pulse rounded-full bg-muted" />
                <div className="flex gap-3">
                    {[0, 1, 2, 3].map((i) => (
                        <span key={i} className="size-11 animate-pulse rounded-full bg-muted" />
                    ))}
                </div>
            </div>
        </main>
    );
}