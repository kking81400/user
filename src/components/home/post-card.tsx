"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, Check, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { ProductPost } from "@/types/home";
import { cn } from "@/lib/utils";
import "./home.css";

const fmt = (n: number) => n.toLocaleString("en-US");
const LOW_STOCK = 5;

interface Props {
    post: ProductPost;
    priority?: boolean;
    onLike: (id: ProductPost["id"], like: boolean) => void;
    onSave: (id: ProductPost["id"], save: boolean) => void;
}

/** کارت محصول تب «فروشندگان من» */
function PostCardBase({ post, priority = false, onLike, onSave }: Props) {
    const { shop, price } = post;
    const [color, setColor] = React.useState(post.colors[0]?.code);
    const [size, setSize] = React.useState(post.sizes[0]);

    const showDiscount = price.hasDiscount && price.sell > price.final;
    const limited = post.stock != null && post.stock > 0 && post.stock <= LOW_STOCK;
    const hasVariants = !price.outOfStock && (post.colors.length > 0 || post.sizes.length > 0);

    return (
        <article className="pb-6">
            {/* تصویر + مهر فروشگاه (بالا-چپ) */}
            <div className="relative aspect-[18/25] w-full overflow-hidden bg-[color:var(--hm-skeleton)]">
                {post.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={post.image}
                        alt={post.name}
                        loading={priority ? "eager" : "lazy"}
                        decoding="async"
                        className="absolute inset-0 size-full object-cover"
                    />
                )}
                <Link
                    href={shop.href}
                    dir="ltr"
                    className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/35 py-1 pe-3 ps-1 text-xs font-semibold text-white backdrop-blur-md"
                >
                    {shop.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shop.avatar} alt="" className="size-7 rounded-full object-cover" />
                    ) : (
                        <span className="flex size-7 items-center justify-center rounded-full bg-black text-[10px] font-bold">
              {shop.name.slice(0, 2).toUpperCase()}
            </span>
                    )}
                    <span className="max-w-[120px] truncate">{shop.name}</span>
                </Link>
            </div>

            {/* اکشن‌ها: پسند و نظر (چپ) | ذخیره (راست) */}
            <div dir="ltr" className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center">
                    <button
                        type="button"
                        aria-label={post.isLiked ? "حذف پسند" : "پسندیدن"}
                        aria-pressed={post.isLiked}
                        onClick={() => onLike(post.id, !post.isLiked)}
                        className="flex size-10 items-center justify-center transition-transform active:scale-90"
                    >
                        <Heart
                            className={cn(
                                "size-6 text-[color:var(--hm-text)]",
                                post.isLiked && "fill-rose-500 text-rose-500"
                            )}
                        />
                    </button>
                    <button
                        type="button"
                        aria-label="نظرات"
                        onClick={() => toast.info("نظرات به‌زودی فعال می‌شود")}
                        className="flex size-10 items-center justify-center text-[color:var(--hm-text)]"
                    >
                        <MessageCircle className="size-6 -scale-x-100" />
                    </button>
                </div>
                <button
                    type="button"
                    aria-label={post.isSaved ? "حذف از ذخیره‌ها" : "ذخیره"}
                    aria-pressed={post.isSaved}
                    onClick={() => onSave(post.id, !post.isSaved)}
                    className="flex size-10 items-center justify-center transition-transform active:scale-90"
                >
                    <Bookmark
                        className={cn(
                            "size-6 text-[color:var(--hm-text)]",
                            post.isSaved && "fill-[color:var(--hm-brand)] text-[color:var(--hm-brand)]"
                        )}
                    />
                </button>
            </div>

            {/* قیمت (چپ) | رنگ و سایز (راست) */}
            <div dir="ltr" className="flex items-start justify-between gap-4 px-4">
                <div dir="rtl" className="min-w-0 pt-1 text-start">
                    {price.outOfStock ? (
                        <p className="text-sm font-bold text-[color:var(--hm-brand)]">
                            قیمت : <span>ناموجود</span>
                        </p>
                    ) : (
                        <>
                            <p className="whitespace-nowrap text-sm font-bold text-[color:var(--hm-brand)]">
                                قیمت : <span dir="ltr">{fmt(price.final)}</span>ریال
                            </p>
                            {showDiscount && (
                                <p dir="ltr" className="mt-0.5 text-xs text-[color:var(--hm-text-faint)] line-through">
                                    {fmt(price.sell)}
                                </p>
                            )}
                            {limited && (
                                <p className="mt-2 text-[11px] text-[color:var(--hm-brand)]">موجودی : {post.stock} عدد</p>
                            )}
                        </>
                    )}
                </div>

                {hasVariants && (
                    <div dir="rtl" className="flex shrink-0 flex-col gap-3">
                        {post.colors.length > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="w-9 text-sm text-[color:var(--hm-text)]">رنگ</span>
                                <div className="flex gap-2">
                                    {post.colors.slice(0, 5).map((c, i) => {
                                        const sel = c.code === color;
                                        return (
                                            <button
                                                key={`${c.code}-${i}`}
                                                type="button"
                                                title={c.name}
                                                aria-label={c.name || c.code}
                                                aria-pressed={sel}
                                                onClick={() => setColor(c.code)}
                                                className="flex size-8 items-center justify-center rounded-full border border-[color:var(--hm-border)]"
                                                style={{ backgroundColor: c.code }}
                                            >
                                                {sel && <Check className="size-4 text-white mix-blend-difference" strokeWidth={3} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {post.sizes.length > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="w-9 text-sm text-[color:var(--hm-text)]">سایز</span>
                                <div className="flex gap-1">
                                    {post.sizes.slice(0, 5).map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            aria-pressed={s === size}
                                            onClick={() => setSize(s)}
                                            className={cn(
                                                "flex size-8 items-center justify-center rounded-full text-xs",
                                                s === size
                                                    ? "bg-[color:var(--hm-muted)] font-bold text-[color:var(--hm-text)] ring-1 ring-[color:var(--hm-border)]"
                                                    : "text-[color:var(--hm-text)]"
                                            )}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* سبد خرید */}
            <div className="px-4 pt-4">
                <button
                    type="button"
                    disabled={price.outOfStock}
                    onClick={() => toast.info("افزودن به سبد خرید هنوز به API وصل نشده است")}
                    className={cn(
                        "h-14 w-full rounded-3xl text-sm font-bold transition-colors",
                        price.outOfStock
                            ? "cursor-not-allowed bg-[color:var(--hm-disabled-bg)] text-[color:var(--hm-disabled-text)]"
                            : "bg-[color:var(--hm-brand)] text-[color:var(--hm-on-brand)] active:bg-[color:var(--hm-brand-hover)]"
                    )}
                >
                    افزودن به سبد خرید
                </button>
            </div>

            {post.description && (
                <p className="px-4 pt-3 text-justify text-[11px] leading-6 text-[color:var(--hm-text)]">{post.description}</p>
            )}
            {post.timeAgo && <p className="px-4 pt-1 text-[10px] text-[color:var(--hm-text-muted)]">{post.timeAgo}</p>}
        </article>
    );
}

export const PostCard = React.memo(PostCardBase);

export function PostSkeleton({ count = 2 }: { count?: number }) {
    return (
        <div>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="pb-6">
                    <div className="aspect-[18/25] w-full animate-pulse bg-[color:var(--hm-skeleton)]" />
                    <div className="mx-4 mt-14 h-14 animate-pulse rounded-3xl bg-[color:var(--hm-skeleton)]" />
                </div>
            ))}
        </div>
    );
}